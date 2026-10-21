import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { getLedger } from "@/modules/transactions/queries/ledger";
import { limitFormula } from "../lib/basis";
import { budgetContextOf, budgetUsage, type BudgetContext } from "../lib/budget";
import type { Budget } from "../types/budget";
import type { Category } from "../types/category";

export interface BudgetSetting extends Budget {
  formula: string;
  limit: number;
  used: number;
  overBy: number;
}

export interface BudgetSettings {
  projectId: string;
  locked: boolean;
  context: BudgetContext;
  budgets: BudgetSetting[];
  /** Kategori pengeluaran aktif — pilihan untuk pagu. */
  categories: Category[];
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
      return { ...budget, formula: limitFormula(budget, context), limit: usage.limit, used: usage.used, overBy: usage.overBy };
    }),
    categories: ledger.categories.filter((c) => c.kind === "expense" && !c.archived),
  };
});
