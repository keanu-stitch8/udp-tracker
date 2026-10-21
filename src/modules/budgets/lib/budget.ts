// Pagu (spec §3.3): nilai = tarif × basis × hari; kelebihan pemakaian = lebih pagu (overBy).
import { sum } from "@/modules/shared/lib/money";
import type { BudgetBasis } from "@/modules/shared/types/enums";
import type { ExpenseEntry } from "@/modules/transactions/types/transaction";
import type { Budget, BudgetTotal, BudgetUsage, DailyBudgetUsage } from "../types/budget";

export interface BudgetContext {
  pax: number;
  vehicleCount: number;
  days: number;
}

export function budgetContextOf(project: { pax: number; days: number; vehicles: unknown[] }): BudgetContext {
  return { pax: project.pax, vehicleCount: project.vehicles.length, days: project.days };
}

/** Tarif + basis (+ jumlah hari khusus bila ada) — cukup untuk menghitung batas pagu. */
export type BudgetRule = Pick<Budget, "rate" | "basis"> & Partial<Pick<Budget, "days">>;

/** Basis yang dikali jumlah hari. */
export function usesDays(basis: BudgetBasis): boolean {
  return basis === "per_pax_per_day" || basis === "per_vehicle_per_day" || basis === "per_day";
}

/** Jumlah hari pagu: isian khusus pagu, atau periode proyek. */
export function budgetDays(budget: BudgetRule, ctx: BudgetContext): number {
  return budget.days ?? ctx.days;
}

/** Batas per hari; null untuk basis yang tidak dikali hari (per_vehicle, lump_sum). */
export function dailyLimit(budget: BudgetRule, ctx: BudgetContext): number | null {
  switch (budget.basis) {
    case "per_pax_per_day":
      return budget.rate * ctx.pax;
    case "per_vehicle_per_day":
      return budget.rate * ctx.vehicleCount;
    case "per_day":
      return budget.rate;
    case "per_vehicle":
    case "lump_sum":
      return null;
  }
}

export function budgetLimit(budget: BudgetRule, ctx: BudgetContext): number {
  // per_vehicle: `days` = jumlah trip (mis. 2 = pergi + pulang), default 1.
  if (budget.basis === "per_vehicle") return budget.rate * ctx.vehicleCount * (budget.days ?? 1);
  const daily = dailyLimit(budget, ctx);
  return daily === null ? budget.rate : daily * budgetDays(budget, ctx);
}

const usedBy = (budget: Budget, entries: ExpenseEntry[]) => {
  const ids = new Set(budget.categoryIds);
  return sum(entries.filter((e) => e.categoryId !== null && ids.has(e.categoryId)).map((e) => e.amount));
};

export function budgetUsage(budget: Budget, ctx: BudgetContext, entries: ExpenseEntry[]): BudgetUsage {
  const limit = budgetLimit(budget, ctx);
  const used = usedBy(budget, entries);
  return {
    budgetId: budget.id,
    name: budget.name,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    overBy: Math.max(used - limit, 0),
    ratio: limit > 0 ? used / limit : 0,
  };
}

/** Total pagu: Σ batas semua pagu vs pengeluaran berkategori tercakup (tiap pengeluaran dihitung sekali). */
export function totalBudgetUsage(budgets: Budget[], ctx: BudgetContext, entries: ExpenseEntry[]): BudgetTotal {
  const limit = sum(budgets.map((b) => budgetLimit(b, ctx)));
  const covered = new Set(budgets.flatMap((b) => b.categoryIds));
  const used = sum(entries.filter((e) => e.categoryId !== null && covered.has(e.categoryId)).map((e) => e.amount));
  return { limit, used, remaining: Math.max(limit - used, 0), overBy: Math.max(used - limit, 0) };
}

export function dailyBudgetUsage(budget: Budget, ctx: BudgetContext, entries: ExpenseEntry[], date: string): DailyBudgetUsage | null {
  const limit = dailyLimit(budget, ctx);
  if (limit === null) return null;
  return { budgetId: budget.id, name: budget.name, limit, used: usedBy(budget, entries.filter((e) => e.date === date)) };
}
