import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.login", () => {
  it("accepts correct password", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ password: "Titan2026" });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Login successful");
  });

  it("rejects incorrect password", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ password: "wrongpassword" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Senha incorreta");
  });

  it("rejects empty password", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ password: "" });

    expect(result.success).toBe(false);
  });
});

describe("funnel.getFilters", () => {
  it("returns filter options structure", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.getFilters();

    expect(result).toHaveProperty("gestores");
    expect(result).toHaveProperty("redes");
    expect(result).toHaveProperty("nichos");
    expect(result).toHaveProperty("advs");
    expect(result).toHaveProperty("vsls");
    expect(Array.isArray(result.gestores)).toBe(true);
    expect(Array.isArray(result.redes)).toBe(true);
  });
});

describe("funnel.getTotals", () => {
  it("returns totals structure with empty filters", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.getTotals({});

    expect(result).toHaveProperty("totalCost");
    expect(result).toHaveProperty("totalProfit");
    expect(result).toHaveProperty("totalPurchases");
    expect(result).toHaveProperty("roi");
    expect(typeof result.totalCost).toBe("number");
    expect(typeof result.roi).toBe("number");
  });
});

describe("funnel.getData", () => {
  it("returns data array with empty filters", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.getData({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts filter parameters", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.getData({
      gestor: "Carlos",
      rede: "NB",
      nicho: "Memória",
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("funnel.upload", () => {
  it("rejects empty CSV", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.upload({
      csvContent: "",
      replaceExisting: false,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("vazio");
  });

  it("rejects CSV with only headers", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.funnel.upload({
      csvContent: "Campaign,Prelanding,Landing,Date,Cost,Profit,Total ROI,Purchase,InitiateCheckout,CPA",
      replaceExisting: false,
    });

    expect(result.success).toBe(false);
  });
});
