import { int, mysqlTable, text, timestamp, varchar, decimal, date, index } from "drizzle-orm/mysql-core";

/**
 * Funnel data table - stores campaign performance data from RedTrack
 */
export const funnelData = mysqlTable("funnel_data", {
  id: int("id").autoincrement().primaryKey(),
  
  // Campaign identification
  campaign: text("campaign").notNull(),
  gestor: varchar("gestor", { length: 50 }),
  site: varchar("site", { length: 100 }),

  // Funnel components
  nicho: varchar("nicho", { length: 100 }),
  product: varchar("product", { length: 100 }),

  // Date
  date: date("date").notNull(),

  // Metrics
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  roi: decimal("roi", { precision: 8, scale: 4 }).default("0"),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_date").on(table.date),
  index("idx_gestor").on(table.gestor),
  index("idx_site").on(table.site),
  index("idx_nicho").on(table.nicho),
  index("idx_product").on(table.product),
]);

export type FunnelData = typeof funnelData.$inferSelect;
export type InsertFunnelData = typeof funnelData.$inferInsert;
