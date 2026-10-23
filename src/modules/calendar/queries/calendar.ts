import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { budgetContextOf, dailyBudgetUsage } from "@/modules/budgets/lib/budget";
import type { DailyBudgetUsage } from "@/modules/budgets/types/budget";
import { isIsoDate } from "@/modules/shared/lib/date";
import { sum } from "@/modules/shared/lib/money";
import { expenseEntries, sumBy, toTransactionViews } from "@/modules/transactions/lib/ledger";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import type { TransactionView } from "@/modules/transactions/types/transaction";
import { isMonth, monthOf } from "../lib/month";

export interface CalendarMonthData {
  month: string;
  /** Total pengeluaran per tanggal (termasuk biaya admin transfer). */
  totals: Record<string, number>;
}

export const getCalendarMonth = cache(async (db: Db, projectId: string, month: string): Promise<CalendarMonthData> => {
  if (!isMonth(month)) throw new ValidationError({ month: ["Bulan tidak valid."] });
  const ledger = await getLedger(db, projectId);
  const entries = expenseEntries(ledger.transactions, ledger.categories).filter((e) => monthOf(e.date) === month);
  return { month, totals: Object.fromEntries(sumBy(entries, (e) => e.date, (e) => e.amount)) };
});

export interface DayDetail {
  date: string;
  expenseTotal: number;
  byCategory: { categoryId: string | null; name: string; icon: string | null; total: number }[];
  budgets: DailyBudgetUsage[];
  transactions: TransactionView[];
}

/** Tanpa `budgetSecret` pagu tidak dikirim sama sekali (sampai tarif karyawan ada di Rilis 5, pagu = tarif management). */
export const getDayDetail = cache(async (db: Db, projectId: string, date: string, access: { budgetSecret: boolean }): Promise<DayDetail> => {
  if (!isIsoDate(date)) throw new ValidationError({ date: ["Tanggal tidak valid."] });
  const ledger = await getLedger(db, projectId);
  const entries = expenseEntries(ledger.transactions, ledger.categories).filter((e) => e.date === date);
  const categories = new Map(ledger.categories.map((c) => [c.id, c]));
  const ctx = budgetContextOf(ledger.project);
  return {
    date,
    expenseTotal: sum(entries.map((e) => e.amount)),
    byCategory: [...sumBy(entries, (e) => e.categoryId, (e) => e.amount)]
      .map(([categoryId, total]) => {
        const category = categoryId ? categories.get(categoryId) : undefined;
        return { categoryId, name: category?.name ?? "Biaya admin", icon: category?.icon ?? "landmark", total };
      })
      .sort((a, b) => b.total - a.total),
    budgets: access.budgetSecret ? ledger.budgets.map((b) => dailyBudgetUsage(b, ctx, entries, date)).filter((b): b is DailyBudgetUsage => b !== null) : [],
    transactions: toTransactionViews(
      ledger.transactions.filter((t) => t.date === date),
      refsOf(ledger),
    ),
  };
});
