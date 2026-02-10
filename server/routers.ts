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
  getDailyTotals
} from "./db";

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
  }),
});

export type AppRouter = typeof appRouter;
