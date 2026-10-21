import { describe, expect, it } from "vitest";
import { categories, mealBudget, transactions } from "@tests/helpers/ledger-fixture";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { budgetContextOf, budgetLimit, budgetUsage, dailyBudgetUsage, dailyLimit } from "./budget";

const ctx = { pax: 9, vehicleCount: 2, days: 6 };
const entries = expenseEntries(transactions, categories);

describe("pagu", () => {
  it("budgetContextOf dari detail proyek", () => {
    expect(budgetContextOf({ pax: 9, days: 6, vehicles: [{}, {}] })).toEqual(ctx);
  });
  it("batas harian & total per basis", () => {
    expect(dailyLimit(mealBudget, ctx)).toBe(1_350_000);
    expect(budgetLimit(mealBudget, ctx)).toBe(8_100_000);
    expect(dailyLimit({ rate: 500_000, basis: "per_vehicle_per_day" }, ctx)).toBe(1_000_000);
    expect(budgetLimit({ rate: 100_000, basis: "per_day" }, ctx)).toBe(600_000);
    expect(dailyLimit({ rate: 2_000_000, basis: "lump_sum" }, ctx)).toBeNull();
    expect(budgetLimit({ rate: 2_000_000, basis: "lump_sum" }, ctx)).toBe(2_000_000);
  });
  it("pemakaian hanya dari kategori tercakup", () => {
    expect(budgetUsage(mealBudget, ctx, entries)).toEqual({
      budgetId: "pagu-makan",
      name: "Pagu Makan",
      limit: 8_100_000,
      used: 1_500_000,
      remaining: 6_600_000,
      overBy: 0,
      ratio: 1_500_000 / 8_100_000,
    });
  });
  it("melebihi pagu → overBy (ditanggung kantor)", () => {
    const usage = budgetUsage(mealBudget, { pax: 1, vehicleCount: 0, days: 1 }, entries);
    expect(usage).toMatchObject({ limit: 150_000, used: 1_500_000, remaining: 0, overBy: 1_350_000 });
  });
  it("pagu harian per tanggal; lump_sum → null", () => {
    expect(dailyBudgetUsage(mealBudget, ctx, entries, "2026-10-20")).toEqual({ budgetId: "pagu-makan", name: "Pagu Makan", limit: 1_350_000, used: 1_500_000 });
    expect(dailyBudgetUsage(mealBudget, ctx, entries, "2026-10-21")).toMatchObject({ used: 0 });
    expect(dailyBudgetUsage({ ...mealBudget, basis: "lump_sum" }, ctx, entries, "2026-10-20")).toBeNull();
  });
});
