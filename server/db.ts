import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { funnelData, InsertFunnelData } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}


// ============================================
// Funnel Data Functions
// ============================================

/**
 * Insert funnel data in batch
 * Used for importing data from RedTrack API
 */
export async function insertFunnelDataBatch(records: InsertFunnelData[]): Promise<number> {
  const db = await getDb();
  if (!db || records.length === 0) {
    return 0;
  }

  try {
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        await db.insert(funnelData).values(batch);
        totalInserted += batch.length;
      } catch (batchError) {
        console.error(`[Database] Erro ao inserir batch:`, batchError);

        for (let j = 0; j < batch.length; j++) {
          try {
            await db.insert(funnelData).values([batch[j]]);
            totalInserted++;
          } catch (singleError) {
            // Silencioso
          }
        }
      }
    }

    return totalInserted;
  } catch (error) {
    console.error('[Database] Erro crítico:', error);
    throw error;
  }
}


/**
 * Delete funnel data for a specific date range
 * Useful for re-importing data
 */
export async function deleteFunnelDataByDateRange(startDate: string, endDate: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot delete funnel data: database not available');
    return 0;
  }

  try {
    await db
      .delete(funnelData)
      .where(
        and(
          gte(funnelData.date, new Date(startDate)),
          lte(funnelData.date, new Date(endDate))
        )
      );

    console.log(`[Database] Deleted funnel data from ${startDate} to ${endDate}`);
    return 0; // MySQL driver doesn't return affected rows count easily
  } catch (error) {
    console.error('[Database] Failed to delete funnel data:', error);
    throw error;
  }
}

export async function getExistingDates(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ date: funnelData.date })
    .from(funnelData)
    .orderBy(desc(funnelData.date));

  return result.map(r => r.date ? new Date(r.date).toISOString().split('T')[0] : '');
}



export interface FunnelFilters {
  gestor?: string;
  site?: string;
  nicho?: string;
  product?: string;
  dataInicio?: string;
  dataFim?: string;
}


/**
 * Get raw funnel data without aggregation (returns all individual records)
 */
export async function getRawFunnelData(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.site) {
    conditions.push(eq(funnelData.site, filters.site));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.product) {
    conditions.push(eq(funnelData.product, filters.product));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.date, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.date, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get all raw records without aggregation
  const result = await db
    .select({
      gestor: funnelData.gestor,
      site: funnelData.site,
      nicho: funnelData.nicho,
      product: funnelData.product,
      date: funnelData.date,
      totalCost: funnelData.cost,
      totalProfit: funnelData.profit,
      avgRoi: funnelData.roi,
    })
    .from(funnelData)
    .where(whereClause)
    .orderBy(desc(funnelData.date), desc(funnelData.cost));

  // Fix date timezone issue
  return result.map(r => {
    let dateStr = '';
    if (r.date) {
      const d = new Date(r.date);
      d.setUTCHours(12);
      dateStr = d.toISOString().split('T')[0];
    }
    return {
      ...r,
      date: dateStr ? new Date(dateStr + 'T12:00:00Z') : r.date,
      dateStr,
      totalCost: String(r.totalCost || 0),
      totalProfit: String(r.totalProfit || 0),
      avgRoi: String(r.avgRoi || 0),
    };
  });
}

/**
 * Get aggregated funnel data (sums by gestor, site, nicho, product, date)
 */
export async function getAggregatedFunnelData(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.site) {
    conditions.push(eq(funnelData.site, filters.site));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.product) {
    conditions.push(eq(funnelData.product, filters.product));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.date, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.date, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Aggregate by gestor, site, nicho, product, date
  const result = await db
    .select({
      gestor: funnelData.gestor,
      site: funnelData.site,
      nicho: funnelData.nicho,
      product: funnelData.product,
      date: funnelData.date,
      totalCost: sql<string>`SUM(${funnelData.cost})`,
      totalProfit: sql<string>`SUM(${funnelData.profit})`,
      avgRoi: sql<string>`AVG(${funnelData.roi})`,
    })
    .from(funnelData)
    .where(whereClause)
    .groupBy(
      funnelData.gestor,
      funnelData.site,
      funnelData.nicho,
      funnelData.product,
      funnelData.date
    )
    .orderBy(desc(sql`SUM(${funnelData.cost})`));

  // Fix date timezone issue
  return result.map(r => {
    let dateStr = '';
    if (r.date) {
      const d = new Date(r.date);
      d.setUTCHours(12); // Set to noon UTC to avoid date shift
      dateStr = d.toISOString().split('T')[0];
    }
    return {
      ...r,
      date: dateStr ? new Date(dateStr + 'T12:00:00Z') : r.date,
      dateStr,
    };
  });
}

export async function getFilterOptions() {
  const db = await getDb();
  if (!db) return { gestores: [], sites: [], nichos: [], products: [] };

  const [gestores, sites, nichos, products] = await Promise.all([
    db.selectDistinct({ value: funnelData.gestor }).from(funnelData).where(sql`${funnelData.gestor} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.site }).from(funnelData).where(sql`${funnelData.site} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.nicho }).from(funnelData).where(sql`${funnelData.nicho} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.product }).from(funnelData).where(sql`${funnelData.product} IS NOT NULL`),
  ]);

  return {
    gestores: gestores.map(g => g.value).filter(Boolean) as string[],
    sites: sites.map(s => s.value).filter(Boolean) as string[],
    nichos: nichos.map(n => n.value).filter(Boolean) as string[],
    products: products.map(p => p.value).filter(Boolean) as string[],
  };
}

export async function getTotals(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return { totalCost: 0, totalProfit: 0, roi: 0 };

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.site) {
    conditions.push(eq(funnelData.site, filters.site));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.product) {
    conditions.push(eq(funnelData.product, filters.product));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.date, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.date, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      totalCost: sql<string>`COALESCE(SUM(${funnelData.cost}), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(${funnelData.profit}), 0)`,
    })
    .from(funnelData)
    .where(whereClause);

  const totals = result[0];
  const cost = parseFloat(totals?.totalCost || '0');
  const profit = parseFloat(totals?.totalProfit || '0');
  const roi = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    totalCost: cost,
    totalProfit: profit,
    roi,
  };
}


// Get daily totals for chart
export async function getDailyTotals(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.site) {
    conditions.push(eq(funnelData.site, filters.site));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.product) {
    conditions.push(eq(funnelData.product, filters.product));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.date, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.date, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      date: funnelData.date,
      totalCost: sql<string>`COALESCE(SUM(${funnelData.cost}), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(${funnelData.profit}), 0)`,
    })
    .from(funnelData)
    .where(whereClause)
    .groupBy(funnelData.date)
    .orderBy(funnelData.date);

  return result.map(r => {
    const cost = parseFloat(r.totalCost) || 0;
    const profit = parseFloat(r.totalProfit) || 0;
    const roi = cost > 0 ? profit / cost : 0;
    // Handle date properly - add 12 hours to avoid timezone issues
    let dateStr = '';
    if (r.date) {
      const d = new Date(r.date);
      d.setUTCHours(12); // Set to noon UTC to avoid date shift
      dateStr = d.toISOString().split('T')[0];
    }
    return {
      date: dateStr,
      cost,
      profit,
      roi,
    };
  });
}
