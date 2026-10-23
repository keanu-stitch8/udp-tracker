import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { todayWib } from "@/modules/shared/lib/date";
import { sum } from "@/modules/shared/lib/money";
import { expenseEntries, ledgerTotals, toTransactionViews } from "@/modules/transactions/lib/ledger";
import { isMissingReceipt } from "@/modules/transactions/lib/receipt";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import type { LedgerTotals, TransactionView } from "@/modules/transactions/types/transaction";
import { selectProjectBalanceChecks } from "@/modules/wallets/api/balance-checks-repo";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { WalletBalance } from "@/modules/wallets/types/wallet";
import { attentionItems, type AttentionItem, type LatestCheck } from "../lib/attention";
import { groupShares, type GroupShare } from "../lib/category-share";
import { elapsedDays, projectProgress, type ProjectProgress } from "../lib/progress";
import { recentlyAdded } from "../lib/recent";

/** Data beranda. Sengaja tanpa pagu: rahasia management, tidak dikirim ke browser. */
export interface DashboardSummary {
  totals: LedgerTotals;
  progress: ProjectProgress;
  todayExpense: number;
  /** null sebelum proyek mulai. */
  dailyAverage: number | null;
  attention: AttentionItem[];
  /** Pengeluaran per grup kategori (struktur RAB). */
  groups: GroupShare[];
  wallets: WalletBalance[];
  recent: TransactionView[];
}

export const getDashboardSummary = cache(async (db: Db, projectId: string): Promise<DashboardSummary> => {
  const [ledger, checkRows] = await Promise.all([getLedger(db, projectId), selectProjectBalanceChecks(db, projectId)]);
  const balances = walletBalances(ledger.wallets, ledger.transactions);
  const entries = expenseEntries(ledger.transactions, ledger.categories);
  const views = toTransactionViews(ledger.transactions, refsOf(ledger));
  const adminCategoryId = ledger.categories.find((c) => c.isAdminFee)?.id ?? null;
  const totals = ledgerTotals(ledger.wallets, ledger.categories, ledger.transactions);
  const today = todayWib();
  const progress = projectProgress(ledger.project.startDate, ledger.project.endDate, today);
  const elapsed = elapsedDays(progress);
  const wallets = ledger.wallets.filter((w) => !w.archived).map((w) => ({ ...w, balance: balances.get(w.id) ?? w.openingBalance }));

  const adjusted = new Set(ledger.transactions.flatMap((t) => (t.balanceCheckId ? [t.balanceCheckId] : [])));
  const seen = new Set<string>();
  const latestChecks: LatestCheck[] = [];
  for (const row of checkRows) {
    if (seen.has(row.walletId)) continue;
    seen.add(row.walletId);
    latestChecks.push({ walletId: row.walletId, difference: row.actualBalance - row.computedBalance, adjusted: adjusted.has(row.id) });
  }

  return {
    totals,
    progress,
    todayExpense: sum(entries.filter((e) => e.date === today).map((e) => e.amount)),
    dailyAverage: elapsed > 0 ? Math.round(totals.totalExpense / elapsed) : null,
    attention: attentionItems({ missingReceipts: views.filter((v) => isMissingReceipt(v, adminCategoryId)).length, wallets, latestChecks }),
    groups: groupShares(entries, ledger.categories, ledger.groups),
    wallets,
    recent: recentlyAdded(views, 5),
  };
});
