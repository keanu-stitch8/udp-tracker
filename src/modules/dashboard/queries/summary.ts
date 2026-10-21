import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { budgetContextOf, budgetUsage } from "@/modules/budgets/lib/budget";
import type { BudgetUsage } from "@/modules/budgets/types/budget";
import { expenseEntries, ledgerTotals, toTransactionViews } from "@/modules/transactions/lib/ledger";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import type { LedgerTotals, TransactionView } from "@/modules/transactions/types/transaction";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { WalletBalance } from "@/modules/wallets/types/wallet";

export interface DashboardSummary {
  totals: LedgerTotals;
  wallets: WalletBalance[];
  budgets: BudgetUsage[];
  recent: TransactionView[];
}

export const getDashboardSummary = cache(async (db: Db, projectId: string): Promise<DashboardSummary> => {
  const ledger = await getLedger(db, projectId);
  const balances = walletBalances(ledger.wallets, ledger.transactions);
  const entries = expenseEntries(ledger.transactions, ledger.categories);
  const ctx = budgetContextOf(ledger.project);
  return {
    totals: ledgerTotals(ledger.wallets, ledger.categories, ledger.transactions),
    wallets: ledger.wallets.filter((w) => !w.archived).map((w) => ({ ...w, balance: balances.get(w.id) ?? w.openingBalance })),
    budgets: ledger.budgets.map((b) => budgetUsage(b, ctx, entries)),
    recent: toTransactionViews(ledger.transactions, refsOf(ledger)).slice(0, 5),
  };
});
