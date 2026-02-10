import { eq, and, gte, lte, sql, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, funnelData, InsertFunnelData, FunnelData } from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// Funnel Data Functions
// ============================================

export async function getExistingDates(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ date: funnelData.dataRegistro })
    .from(funnelData)
    .orderBy(desc(funnelData.dataRegistro));

  return result.map(r => r.date ? new Date(r.date).toISOString().split('T')[0] : '');
}

export async function checkDatesExist(dates: string[]): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  // Convert string dates to Date objects for comparison
  const dateObjects = dates.map(d => new Date(d));
  
  const result = await db
    .selectDistinct({ date: funnelData.dataRegistro })
    .from(funnelData)
    .where(inArray(funnelData.dataRegistro, dateObjects));

  return result.map(r => r.date ? new Date(r.date).toISOString().split('T')[0] : '');
}

export async function deleteDataByDates(dates: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const dateObjects = dates.map(d => new Date(d));
  await db.delete(funnelData).where(inArray(funnelData.dataRegistro, dateObjects));
}

export async function insertFunnelData(data: InsertFunnelData[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(funnelData).values(batch);
  }
}

export interface FunnelFilters {
  gestor?: string;
  rede?: string;
  nicho?: string;
  adv?: string;
  vsl?: string;
  dataInicio?: string;
  dataFim?: string;
}

export async function getFunnelData(filters: FunnelFilters): Promise<FunnelData[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.rede) {
    conditions.push(eq(funnelData.rede, filters.rede));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.adv) {
    conditions.push(eq(funnelData.adv, filters.adv));
  }
  if (filters.vsl) {
    conditions.push(eq(funnelData.vsl, filters.vsl));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.dataRegistro, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.dataRegistro, new Date(filters.dataFim)));
  }

  const query = conditions.length > 0
    ? db.select().from(funnelData).where(and(...conditions))
    : db.select().from(funnelData);

  return await query;
}

export async function getAggregatedFunnelData(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.rede) {
    conditions.push(eq(funnelData.rede, filters.rede));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.adv) {
    conditions.push(eq(funnelData.adv, filters.adv));
  }
  if (filters.vsl) {
    conditions.push(eq(funnelData.vsl, filters.vsl));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.dataRegistro, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.dataRegistro, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Aggregate by nicho, adv, vsl, produto, date
  const result = await db
    .select({
      nicho: funnelData.nicho,
      adv: funnelData.adv,
      vsl: funnelData.vsl,
      produto: funnelData.produto,
      dataRegistro: funnelData.dataRegistro,
      totalCost: sql<string>`SUM(${funnelData.cost})`,
      totalProfit: sql<string>`SUM(${funnelData.profit})`,
      totalPurchases: sql<number>`SUM(${funnelData.purchases})`,
      totalInitiateCheckoutCPA: sql<string>`SUM(${funnelData.initiateCheckoutCPA})`,
    })
    .from(funnelData)
    .where(whereClause)
    .groupBy(
      funnelData.nicho,
      funnelData.adv,
      funnelData.vsl,
      funnelData.produto,
      funnelData.dataRegistro
    )
    .orderBy(desc(sql`SUM(${funnelData.cost})`));

  // Fix date timezone issue
  return result.map(r => {
    let dateStr = '';
    if (r.dataRegistro) {
      const d = new Date(r.dataRegistro);
      d.setUTCHours(12); // Set to noon UTC to avoid date shift
      dateStr = d.toISOString().split('T')[0];
    }
    return {
      ...r,
      dataRegistro: dateStr ? new Date(dateStr + 'T12:00:00Z') : r.dataRegistro,
      dateStr,
    };
  });
}

export async function getFilterOptions() {
  const db = await getDb();
  if (!db) return { gestores: [], redes: [], nichos: [], advs: [], vsls: [] };

  const [gestores, redes, nichos, advs, vsls] = await Promise.all([
    db.selectDistinct({ value: funnelData.gestor }).from(funnelData).where(sql`${funnelData.gestor} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.rede }).from(funnelData).where(sql`${funnelData.rede} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.nicho }).from(funnelData).where(sql`${funnelData.nicho} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.adv }).from(funnelData).where(sql`${funnelData.adv} IS NOT NULL`),
    db.selectDistinct({ value: funnelData.vsl }).from(funnelData).where(sql`${funnelData.vsl} IS NOT NULL`),
  ]);

  return {
    gestores: gestores.map(g => g.value).filter(Boolean) as string[],
    redes: redes.map(r => r.value).filter(Boolean) as string[],
    nichos: nichos.map(n => n.value).filter(Boolean) as string[],
    advs: advs.map(a => a.value).filter(Boolean) as string[],
    vsls: vsls.map(v => v.value).filter(Boolean) as string[],
  };
}

export async function getTotals(filters: FunnelFilters) {
  const db = await getDb();
  if (!db) return { totalCost: 0, totalProfit: 0, totalPurchases: 0, roi: 0 };

  const conditions = [];

  if (filters.gestor) {
    conditions.push(eq(funnelData.gestor, filters.gestor));
  }
  if (filters.rede) {
    conditions.push(eq(funnelData.rede, filters.rede));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.adv) {
    conditions.push(eq(funnelData.adv, filters.adv));
  }
  if (filters.vsl) {
    conditions.push(eq(funnelData.vsl, filters.vsl));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.dataRegistro, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.dataRegistro, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      totalCost: sql<string>`COALESCE(SUM(${funnelData.cost}), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(${funnelData.profit}), 0)`,
      totalPurchases: sql<number>`COALESCE(SUM(${funnelData.purchases}), 0)`,
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
    totalPurchases: totals?.totalPurchases || 0,
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
  if (filters.rede) {
    conditions.push(eq(funnelData.rede, filters.rede));
  }
  if (filters.nicho) {
    conditions.push(eq(funnelData.nicho, filters.nicho));
  }
  if (filters.adv) {
    conditions.push(eq(funnelData.adv, filters.adv));
  }
  if (filters.vsl) {
    conditions.push(eq(funnelData.vsl, filters.vsl));
  }
  if (filters.dataInicio) {
    conditions.push(gte(funnelData.dataRegistro, new Date(filters.dataInicio)));
  }
  if (filters.dataFim) {
    conditions.push(lte(funnelData.dataRegistro, new Date(filters.dataFim)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      date: funnelData.dataRegistro,
      totalCost: sql<string>`COALESCE(SUM(${funnelData.cost}), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(${funnelData.profit}), 0)`,
    })
    .from(funnelData)
    .where(whereClause)
    .groupBy(funnelData.dataRegistro)
    .orderBy(funnelData.dataRegistro);

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
