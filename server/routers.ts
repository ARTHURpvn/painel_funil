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

export const appRouter = router({
  system: systemRouter,

  funnel: router({
    // Get filter options
    getFilters: publicProcedure.query(async () => {
      return await getFilterOptions();
    }),

    // Get aggregated data with filters
    getData: publicProcedure
      .input(z.object({
        gestor: z.string().optional(),
        site: z.string().optional(),
        nicho: z.string().optional(),
        product: z.string().optional(),
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
        site: z.string().optional(),
        nicho: z.string().optional(),
        product: z.string().optional(),
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
        site: z.string().optional(),
        nicho: z.string().optional(),
        product: z.string().optional(),
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
        startDate: z.string(),
        endDate: z.string(),
        replaceExisting: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          const redTrack = getRedTrackService();
          const report = await redTrack.getCampaignReport(
            input.startDate,
            input.endDate,
          );

          if (!report || report.length === 0) {
            return {
              success: true,
              message: 'Nenhum dado encontrado no período selecionado',
              recordsImported: 0,
            };
          }

          if (input.replaceExisting) {
            await deleteFunnelDataByDateRange(input.startDate, input.endDate);
          }

          const records: InsertFunnelData[] = report.map(row => {
            return {
              campaign: row.campaign || '',
              gestor: row.gestor || null,
              site: row.site || null,
              nicho: row.nicho || null,
              product: row.product || null,
              date: new Date(row.date),
              cost: row.cost?.toString() || '0',
              profit: row.profit?.toString() || '0',
              roi: row.roi?.toString() || '0',
            };
          });

          const count = await insertFunnelDataBatch(records);

          return {
            success: true,
            message: `${count} registros importados com sucesso`,
            recordsImported: count,
          };
        } catch (error) {
          console.error('[Import] Erro:', error);
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


export type AppRouter = typeof appRouter;
