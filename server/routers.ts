import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getFilterOptions, 
  getAggregatedFunnelData, 
  getTotals, 
  getExistingDates,
  getDailyTotals,
  insertFunnelDataBatch,
  deleteFunnelDataByDateRange
} from "./db";
import { getRedTrackService } from "./redtrack";
import { InsertFunnelData } from "../drizzle/schema";

// Password for simple auth
const ACCESS_PASSWORD = "Titan2026";


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

    // Import data from RedTrack API
    importFromRedTrack: publicProcedure
      .input(z.object({
        startDate: z.string(), // YYYY-MM-DD format
        endDate: z.string(),   // YYYY-MM-DD format
        replaceExisting: z.boolean().optional().default(false),
        campaignFilter: z.string().optional(), // e.g., 'NTE'
      }))
      .mutation(async ({ input }) => {
        try {
          const redTrack = getRedTrackService();

          // Fetch data from RedTrack
          const report = await redTrack.getCampaignReport(
            input.startDate,
            input.endDate,
            ['campaign', 'sub1', 'sub2', 'sub3'],
            input.campaignFilter
          );

          if (!report || report.length === 0) {
            return {
              success: true,
              message: 'Nenhum dado encontrado no período selecionado',
              recordsImported: 0,
            };
          }

          // Delete existing data if replaceExisting is true
          if (input.replaceExisting) {
            await deleteFunnelDataByDateRange(input.startDate, input.endDate);
          }

          // Parse campaign data and transform to database format
          const records: InsertFunnelData[] = report.map(row => {
            // Use sub1, sub2, sub3 from RedTrack as components
            // Format: campaign, sub1 (gestor), sub2 (rede), sub3 (nicho)
            const campaignName = row.campaign || '';

            return {
              campaign: campaignName,
              gestor: row.sub1 || null,
              rede: row.sub2 || null,
              nicho: row.sub3 || null,
              adv: row.sub4 || null,
              vsl: row.sub5 || null,
              produto: null, // Can be extracted from campaign name if needed
              dataRegistro: new Date(input.startDate), // RedTrack aggregates by date range
              cost: typeof row.cost === 'string' ? row.cost : row.cost?.toString() || '0',
              profit: typeof row.profit === 'string' ? row.profit : row.profit?.toString() || '0',
              roi: typeof row.roi === 'string' ? row.roi : row.roi?.toString() || '0',
              purchases: typeof row.conversions === 'string' ? parseInt(row.conversions) : row.conversions || 0,
              initiateCheckoutCPA: typeof row.cpa === 'string' ? row.cpa : row.cpa?.toString() || '0',
            };
          });

          // Insert into database
          const count = await insertFunnelDataBatch(records);

          return {
            success: true,
            message: `${count} registros importados com sucesso`,
            recordsImported: count,
          };
        } catch (error) {
          console.error('[Import] Error importing from RedTrack:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro ao importar dados',
            recordsImported: 0,
          };
        }
      }),

    // Test RedTrack connection
    testRedTrackConnection: publicProcedure.query(async () => {
      try {
        const redTrack = getRedTrackService();
        const isConnected = await redTrack.testConnection();

        return {
          success: isConnected,
          message: isConnected ? 'Conexão bem-sucedida' : 'Falha na conexão',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao testar conexão',
        };
      }
    }),
  }),
});

/**
 * Parse campaign name to extract funnel components
 * Expected format: GESTOR_REDE_NICHO_ADV_VSL_PRODUTO
 * Example: ARTHUR_FB_EMAGRECIMENTO_ADV01_VSL01_PRODUTOX
 */
function parseCampaignName(campaignName: string): {
  gestor?: string;
  rede?: string;
  nicho?: string;
  adv?: string;
  vsl?: string;
  produto?: string;
} {
  const parts = campaignName.split('_');

  if (parts.length < 6) {
    // If campaign name doesn't follow the expected format, return partial data
    return {
      gestor: parts[0] || undefined,
      rede: parts[1] || undefined,
      nicho: parts[2] || undefined,
      adv: parts[3] || undefined,
      vsl: parts[4] || undefined,
      produto: parts[5] || undefined,
    };
  }

  return {
    gestor: parts[0],
    rede: parts[1],
    nicho: parts[2],
    adv: parts[3],
    vsl: parts[4],
    produto: parts.slice(5).join('_'), // Join remaining parts for produto name
  };
}

export type AppRouter = typeof appRouter;
