import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { getLedger } from "@/modules/transactions/queries/ledger";
import { limitFormula } from "../lib/basis";
import { asEmployeeBudget, budgetContextOf, budgetUsage, dualBudgetTotal, type BudgetContext } from "../lib/budget";
import type { Budget, DualBudgetTotal } from "../types/budget";
import type { Category } from "../types/category";
import type { CategoryGroup } from "../types/category-group";

/** Pagu management (`formula`, `limit`, `overBy`) dan pagu karyawan (`employee…`; sama bila tanpa tarif karyawan). */
export interface BudgetSetting extends Budget {
  formula: string;
  limit: number;
  used: number;
  overBy: number;
  employeeFormula: string;
  employeeLimit: number;
  employeeOverBy: number;
}

export interface BudgetSettings {
  projectId: string;
  locked: boolean;
  context: BudgetContext;
  budgets: BudgetSetting[];
  total: DualBudgetTotal;
  /** Kategori pengeluaran aktif — pilihan untuk pagu. */
  categories: Category[];
  groups: CategoryGroup[];
}

export const getBudgetSettings = cache(async (db: Db, projectId: string): Promise<BudgetSettings> => {
  const ledger = await getLedger(db, projectId);
  const context = budgetContextOf(ledger.project);
  const entries = expenseEntries(ledger.transactions, ledger.categories);
  return {
    projectId,
    locked: ledger.project.status === "done",
    context,
    budgets: ledger.budgets.map((budget) => {
      const usage = budgetUsage(budget, context, entries);
      const employee = asEmployeeBudget(budget);
      const employeeUsage = budgetUsage(employee, context, entries);
      return {
        ...budget,
        formula: limitFormula(budget, context),
        limit: usage.limit,
        used: usage.used,
        overBy: usage.overBy,
        employeeFormula: limitFormula(employee, context),
        employeeLimit: employeeUsage.limit,
        employeeOverBy: employeeUsage.overBy,
      };
    }),
    total: dualBudgetTotal(ledger.budgets, context, entries),
    categories: ledger.categories.filter((c) => c.kind === "expense" && !c.archived),
    groups: ledger.groups,
  };
});
