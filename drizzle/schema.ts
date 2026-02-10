import { int, mysqlTable, text, timestamp, varchar, decimal, date, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Funnel data table - stores campaign performance data
 */
export const funnelData = mysqlTable("funnel_data", {
  id: int("id").autoincrement().primaryKey(),
  
  // Campaign identification
  campaign: text("campaign").notNull(),
  gestor: varchar("gestor", { length: 50 }),
  rede: varchar("rede", { length: 10 }),
  
  // Funnel components
  nicho: varchar("nicho", { length: 100 }),
  adv: varchar("adv", { length: 50 }),
  vsl: varchar("vsl", { length: 50 }),
  produto: varchar("produto", { length: 100 }),
  
  // Date
  dataRegistro: date("data_registro").notNull(),
  
  // Metrics
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0"),
  roi: decimal("roi", { precision: 8, scale: 4 }).default("0"),
  purchases: int("purchases").default(0),
  initiateCheckoutCPA: decimal("initiate_checkout_cpa", { precision: 12, scale: 2 }).default("0"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_data_registro").on(table.dataRegistro),
  index("idx_gestor").on(table.gestor),
  index("idx_rede").on(table.rede),
  index("idx_nicho").on(table.nicho),
  index("idx_adv").on(table.adv),
  index("idx_vsl").on(table.vsl),
]);

export type FunnelData = typeof funnelData.$inferSelect;
export type InsertFunnelData = typeof funnelData.$inferInsert;
