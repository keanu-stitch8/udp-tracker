import { describe, expect, it } from "vitest";
import { categories, mealBudget, transactions } from "@tests/helpers/ledger-fixture";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { asEmployeeBudget, budgetContextOf, budgetLimit, budgetUsage, dailyBudgetUsage, dailyLimit, dualBudgetTotal, totalBudgetUsage, usesDays } from "./budget";

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
    expect(dailyLimit({ rate: 1_300_000, basis: "per_vehicle" }, ctx)).toBeNull();
    expect(budgetLimit({ rate: 1_300_000, basis: "per_vehicle" }, ctx)).toBe(2_600_000);
  });
  it("jumlah hari per pagu menggantikan periode proyek (hanya basis harian)", () => {
    expect(budgetLimit({ rate: 100_000, basis: "per_vehicle_per_day", days: 4 }, ctx)).toBe(800_000);
    expect(budgetLimit({ rate: 150_000, basis: "per_pax_per_day", days: null }, ctx)).toBe(8_100_000);
    expect(budgetLimit({ rate: 1_300_000, basis: "per_vehicle", days: 2 }, ctx)).toBe(5_200_000);
    expect(budgetLimit({ rate: 2_000_000, basis: "lump_sum", days: 4 }, ctx)).toBe(2_000_000);
    expect(usesDays("per_day")).toBe(true);
    expect(usesDays("per_vehicle")).toBe(false);
  });
  it("total pagu: Σ batas; tiap pengeluaran dihitung sekali walau kategorinya di beberapa pagu", () => {
    const tolBudget = { ...mealBudget, id: "pagu-tol", name: "Tol", rate: 100_000, basis: "lump_sum" as const, categoryIds: ["tol", "makan-siang"] };
    expect(totalBudgetUsage([mealBudget, tolBudget], ctx, entries)).toEqual({ limit: 8_200_000, used: 1_550_000, remaining: 6_650_000, overBy: 0 });
    expect(totalBudgetUsage([], ctx, entries)).toEqual({ limit: 0, used: 0, remaining: 0, overBy: 0 });
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
  it("pagu karyawan: tarif karyawan menggantikan tarif management; kosong = sama", () => {
    expect(asEmployeeBudget({ ...mealBudget, employeeRate: 100_000 })).toMatchObject({ rate: 100_000, employeeRate: null, basis: "per_pax_per_day" });
    expect(asEmployeeBudget(mealBudget).rate).toBe(150_000);
  });
  it("dua pagu: cadangan = management − karyawan; kelebihan atas pagu karyawan tertutup cadangan", () => {
    const small = { pax: 1, vehicleCount: 0, days: 1 };
    // Pakai 1.500.000 (makan); karyawan 1.000.000, management 1.500.000 → lebih 500.000, tertutup.
    expect(dualBudgetTotal([{ ...mealBudget, rate: 1_500_000, employeeRate: 1_000_000 }], small, entries)).toEqual({
      employeeLimit: 1_000_000,
      managementLimit: 1_500_000,
      reserve: 500_000,
      used: 1_500_000,
      overEmployee: 500_000,
      overManagement: 0,
    });
    expect(dualBudgetTotal([mealBudget], small, entries)).toMatchObject({ employeeLimit: 150_000, managementLimit: 150_000, reserve: 0, overEmployee: 1_350_000, overManagement: 1_350_000 });
  });
});
