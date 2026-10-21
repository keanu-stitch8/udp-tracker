// Pagu (spec §3.3): nilai = tarif × basis × hari; kelebihan pemakaian = ditanggung kantor.
import { sum } from "@/modules/shared/lib/money";
import type { ExpenseEntry } from "@/modules/transactions/types/transaction";
import type { Budget, BudgetUsage, DailyBudgetUsage } from "../types/budget";

export interface BudgetContext {
  pax: number;
  vehicleCount: number;
  days: number;
}

export function budgetContextOf(project: { pax: number; days: number; vehicles: unknown[] }): BudgetContext {
  return { pax: project.pax, vehicleCount: project.vehicles.length, days: project.days };
}

/** Batas per hari; null untuk basis yang tidak dikali hari (per_vehicle, lump_sum). */
export function dailyLimit(budget: Pick<Budget, "rate" | "basis">, ctx: BudgetContext): number | null {
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

export function budgetLimit(budget: Pick<Budget, "rate" | "basis">, ctx: BudgetContext): number {
  if (budget.basis === "per_vehicle") return budget.rate * ctx.vehicleCount;
  const daily = dailyLimit(budget, ctx);
  return daily === null ? budget.rate : daily * ctx.days;
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

export function dailyBudgetUsage(budget: Budget, ctx: BudgetContext, entries: ExpenseEntry[], date: string): DailyBudgetUsage | null {
  const limit = dailyLimit(budget, ctx);
  if (limit === null) return null;
  return { budgetId: budget.id, name: budget.name, limit, used: usedBy(budget, entries.filter((e) => e.date === date)) };
}
