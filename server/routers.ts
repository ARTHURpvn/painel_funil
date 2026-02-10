import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getFilterOptions, 
  getAggregatedFunnelData, 
  getTotals, 
  checkDatesExist, 
  deleteDataByDates, 
  insertFunnelData,
  getExistingDates,
  getDailyTotals
} from "./db";
import { InsertFunnelData } from "../drizzle/schema";

// Password for simple auth
const ACCESS_PASSWORD = "Titan2026";

// Product to Nicho mapping
const PRODUCT_NICHO_MAP: Record<string, string> = {
  'memorylift': 'Memória',
  'memoryLift': 'Memória',
  'memory lift': 'Memória',
  'memogenesis': 'Memória',
  'neurocept': 'Memória',
  'biobrain': 'Memória',
  'neurodyne': 'Memória',
  'liporise': 'Emagrecimento',
  'gelatide': 'Emagrecimento',
  'leanflow': 'Emagrecimento',
  'slimdrops': 'Emagrecimento',
  'glucosense': 'Diabetes',
  'glycopezil': 'Diabetes',
  'vitarenew': 'Pele',
  'ereforce': 'ED',
  'sonuszen': 'Tinnitus',
  'prostaguard': 'Próstata',
};

// Extract gestor from campaign name
function extractGestor(campaign: string): string | null {
  const upper = campaign.toUpperCase();
  
  // GB has priority
  if (upper.includes('| GB |') || upper.includes('|GB|')) {
    return 'Barros';
  }
  
  if (upper.includes('NTE-CARLOS') || upper.includes('NTM-CARLOS')) {
    return 'Carlos';
  }
  if (upper.includes('NTE-LUIGI') || upper.includes('NTM-LUIGI')) {
    return 'Luigi';
  }
  if (upper.includes('NTE-ERICK') || upper.includes('NTM-ERICK')) {
    return 'Erick';
  }
  if (upper.includes('NTE-BARROS') || upper.includes('NTM-BARROS')) {
    return 'Barros';
  }
  
  return null;
}

// Extract rede from campaign name
function extractRede(campaign: string): string | null {
  const upper = campaign.toUpperCase();
  
  if (upper.includes('| NB |') || upper.includes('|NB|')) return 'NB';
  if (upper.includes('| TB |') || upper.includes('|TB|')) return 'TB';
  if (upper.includes('| MG |') || upper.includes('|MG|')) return 'MG';
  if (upper.includes('| RC |') || upper.includes('|RC|')) return 'RC';
  if (upper.includes('| OB |') || upper.includes('|OB|')) return 'OB';
  
  return null;
}

// Extract ADV from prelanding
function extractAdv(prelanding: string): string | null {
  if (!prelanding) return null;
  
  // Match patterns like "ADV 02", "ADV02", "adv02.3", "adv03.02"
  const match = prelanding.match(/ADV\s*([\d\.]+)/i);
  if (match) {
    let adv = match[1].replace(/\.$/, ''); // Remove trailing dot
    return `adv${adv}`;
  }
  return null;
}

// Extract VSL and product from landing
function extractVslAndProduct(landing: string): { vsl: string | null; produto: string | null; nicho: string | null } {
  if (!landing) return { vsl: null, produto: null, nicho: null };
  
  // Match patterns like "VSL 70", "VSL70.5", "vsl36.ml1"
  const vslMatch = landing.match(/VSL\s*([\d\w\.]+)/i);
  let vsl = null;
  if (vslMatch) {
    let vslValue = vslMatch[1].replace(/\.$/, ''); // Remove trailing dot
    vsl = `vsl${vslValue}`;
  }
  
  // Extract product name - usually in parentheses or after the VSL
  let produto = null;
  let nicho = null;
  
  // Try to find product in parentheses
  const productMatch = landing.match(/\(([^)]+)\)/);
  if (productMatch) {
    produto = productMatch[1].trim().toLowerCase();
  } else {
    // Try to find product name in the landing string
    for (const [productKey] of Object.entries(PRODUCT_NICHO_MAP)) {
      if (landing.toLowerCase().includes(productKey.toLowerCase())) {
        produto = productKey.toLowerCase();
        break;
      }
    }
  }
  
  // Get nicho from product
  if (produto) {
    const normalizedProduct = produto.toLowerCase().replace(/\s+/g, '');
    for (const [key, value] of Object.entries(PRODUCT_NICHO_MAP)) {
      if (key.toLowerCase().replace(/\s+/g, '') === normalizedProduct) {
        nicho = value;
        break;
      }
    }
  }
  
  return { vsl, produto, nicho };
}

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse header - handle quoted fields
  const parseRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };
  
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return data;
}

// Process CSV data into funnel records
function processCSVData(csvData: Record<string, string>[]): InsertFunnelData[] {
  const records: InsertFunnelData[] = [];
  
  for (const row of csvData) {
    const campaign = row['campaign'] || '';
    const prelanding = row['prelanding'] || '';
    const landing = row['landing'] || '';
    const dateStr = row['date'] || '';
    
    // Parse date - use UTC to avoid timezone issues
    let dataRegistro: Date;
    try {
      // Handle various date formats
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts[2]?.length === 4) {
          // DD/MM/YYYY or MM/DD/YYYY
          dataRegistro = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
        } else {
          const d = new Date(dateStr);
          dataRegistro = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
      } else {
        // YYYY-MM-DD format - parse directly as UTC with noon time to avoid timezone shift
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          dataRegistro = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));
        } else {
          const d = new Date(dateStr);
          dataRegistro = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
        }
      }
      
      if (isNaN(dataRegistro.getTime())) {
        continue; // Skip invalid dates
      }
    } catch {
      continue;
    }
    
    const gestor = extractGestor(campaign);
    const rede = extractRede(campaign);
    const adv = extractAdv(prelanding);
    const { vsl, produto, nicho } = extractVslAndProduct(landing);
    
    // Parse numeric values
    const cost = parseFloat(row['cost']?.replace(/[,$]/g, '') || '0') || 0;
    const profit = parseFloat(row['profit']?.replace(/[,$]/g, '') || '0') || 0;
    const roiStr = row['totalroi'] || row['roi'] || '0';
    const roi = parseFloat(roiStr.replace(/[%,]/g, '')) || 0;
    const purchases = parseInt(row['purchase'] || row['purchases'] || '0') || 0;
    // InitiateCheckout CPA is a single field (cost per initiated checkout)
    const initiateCheckoutCPA = parseFloat(row['initiatecheckoutcpa']?.replace(/[,$]/g, '') || '0') || 0;
    
    records.push({
      campaign,
      gestor,
      rede,
      nicho,
      adv,
      vsl,
      produto,
      dataRegistro,
      cost: cost.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(4),
      purchases,
      initiateCheckoutCPA: initiateCheckoutCPA.toFixed(2),
    });
  }
  
  return records;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Simple password login
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password === ACCESS_PASSWORD) {
          return { success: true, message: 'Login successful' };
        }
        return { success: false, message: 'Senha incorreta' };
      }),
  }),

  funnel: router({
    // Get filter options
    getFilters: publicProcedure.query(async () => {
      return await getFilterOptions();
    }),

    // Get aggregated data with filters
    getData: publicProcedure
      .input(z.object({
        gestor: z.string().optional(),
        rede: z.string().optional(),
        nicho: z.string().optional(),
        adv: z.string().optional(),
        vsl: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getAggregatedFunnelData(input);
      }),

    // Get totals with filters
    getTotals: publicProcedure
      .input(z.object({
        gestor: z.string().optional(),
        rede: z.string().optional(),
        nicho: z.string().optional(),
        adv: z.string().optional(),
        vsl: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getTotals(input);
      }),

    // Get daily totals for chart
    getDailyTotals: publicProcedure
      .input(z.object({
        gestor: z.string().optional(),
        rede: z.string().optional(),
        nicho: z.string().optional(),
        adv: z.string().optional(),
        vsl: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getDailyTotals(input);
      }),

    // Get existing dates in database
    getExistingDates: publicProcedure.query(async () => {
      return await getExistingDates();
    }),

    // Check if dates exist
    checkDates: publicProcedure
      .input(z.object({ dates: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        return await checkDatesExist(input.dates);
      }),

    // Upload CSV data
    upload: publicProcedure
      .input(z.object({
        csvContent: z.string(),
        replaceExisting: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          // Parse CSV
          const csvData = parseCSV(input.csvContent);
          if (csvData.length === 0) {
            return { success: false, message: 'CSV vazio ou formato inválido' };
          }

          // Process into funnel records
          const records = processCSVData(csvData);
          if (records.length === 0) {
            return { success: false, message: 'Nenhum registro válido encontrado no CSV' };
          }

          // Get unique dates from records
          const uniqueDates = Array.from(new Set(records.map(r => {
            const d = r.dataRegistro as Date;
            return d.toISOString().split('T')[0];
          })));

          // Check for existing dates
          const existingDates = await checkDatesExist(uniqueDates);

          if (existingDates.length > 0 && !input.replaceExisting) {
            return {
              success: false,
              duplicateDates: existingDates,
              message: `Datas já existentes: ${existingDates.join(', ')}`,
            };
          }

          // Delete existing data for these dates if replacing
          if (existingDates.length > 0 && input.replaceExisting) {
            await deleteDataByDates(existingDates);
          }

          // Insert new records
          await insertFunnelData(records);

          return {
            success: true,
            message: `${records.length} registros importados com sucesso`,
            recordsImported: records.length,
            datesImported: uniqueDates,
          };
        } catch (error) {
          console.error('Upload error:', error);
          return {
            success: false,
            message: `Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
