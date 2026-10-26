import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { budgetContextOf, budgetUsage, totalBudgetUsage } from "@/modules/budgets/lib/budget";
import type { BudgetTotal, BudgetUsage } from "@/modules/budgets/types/budget";
import { expenseEntries, ledgerTotals, toTransactionViews } from "@/modules/transactions/lib/ledger";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import type { LedgerTotals, TransactionView } from "@/modules/transactions/types/transaction";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { WalletBalance } from "@/modules/wallets/types/wallet";
import { udpBreakdown, type UdpBreakdown } from "../lib/category-share";
import { recentlyAdded } from "../lib/recent";

/** Data beranda. Tindak lanjut pindah ke notifikasi. */
export interface DashboardSummary {
  totals: LedgerTotals;
  /** Pagu management (total + per pagu) — hanya untuk peran `budgetSecret` (pagu management rahasia) dan bila proyek punya pagu; selain itu null. */
  budget: { total: BudgetTotal; items: BudgetUsage[] } | null;
  /** Pengeluaran per grup kategori (struktur RAB), persen dari UDP diterima. */
  udp: UdpBreakdown;
  wallets: WalletBalance[];
  recent: TransactionView[];
}

export const getDashboardSummary = cache(async (db: Db, projectId: string, access: { budgetSecret: boolean }): Promise<DashboardSummary> => {
  const ledger = await getLedger(db, projectId);
  const balances = walletBalances(ledger.wallets, ledger.transactions);
  const entries = expenseEntries(ledger.transactions, ledger.categories);
  const views = toTransactionViews(ledger.transactions, refsOf(ledger));
  const totals = ledgerTotals(ledger.wallets, ledger.categories, ledger.transactions);
  const ctx = budgetContextOf(ledger.project);
  const wallets = ledger.wallets.filter((w) => !w.archived).map((w) => ({ ...w, balance: balances.get(w.id) ?? w.openingBalance }));

  return {
    totals,
    budget: access.budgetSecret && ledger.budgets.length ? { total: totalBudgetUsage(ledger.budgets, ctx, entries), items: ledger.budgets.map((b) => budgetUsage(b, ctx, entries)) } : null,
    udp: udpBreakdown(entries, ledger.categories, ledger.groups, totals.udpReceived),
    wallets,
    recent: recentlyAdded(views, 5),
  };
});
