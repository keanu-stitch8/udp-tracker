// Perhitungan buku kas (spec §3.3). Murni: dipakai beranda, kalender, daftar, dan laporan.
import type { Category } from "@/modules/budgets/types/category";
import type { Vehicle } from "@/modules/projects/types/project";
import { sum } from "@/modules/shared/lib/money";
import type { Wallet } from "@/modules/wallets/types/wallet";
import type { ExpenseEntry, LedgerTotals, Transaction, TransactionView } from "../types/transaction";

/** Semua pengeluaran: transaksi expense + biaya admin transfer (kategori isAdminFee; bukan baris transaksi kedua). */
export function expenseEntries(transactions: Transaction[], categories: Category[]): ExpenseEntry[] {
  const adminCategoryId = categories.find((c) => c.isAdminFee)?.id ?? null;
  const entries: ExpenseEntry[] = [];
  for (const t of transactions) {
    if (t.type === "expense") {
      entries.push({ transactionId: t.id, date: t.date, categoryId: t.categoryId, walletId: t.walletId, amount: t.amount });
    } else if (t.type === "transfer" && t.adminFee > 0) {
      entries.push({ transactionId: t.id, date: t.date, categoryId: adminCategoryId, walletId: t.walletId, amount: t.adminFee });
    }
  }
  return entries;
}

export function ledgerTotals(wallets: Wallet[], categories: Category[], transactions: Transaction[]): LedgerTotals {
  const officeFunding = new Set(categories.filter((c) => c.isOfficeFunding).map((c) => c.id));
  const income = transactions.filter((t) => t.type === "income");
  const openingTotal = sum(wallets.map((w) => w.openingBalance));
  const totalIncome = sum(income.map((t) => t.amount));
  const udpReceived = sum(income.filter((t) => t.categoryId && officeFunding.has(t.categoryId)).map((t) => t.amount));
  const totalExpense = sum(expenseEntries(transactions, categories).map((e) => e.amount));
  return { openingTotal, totalIncome, udpReceived, totalExpense, remaining: openingTotal + totalIncome - totalExpense };
}

export function sumBy<T, K>(items: T[], key: (item: T) => K, value: (item: T) => number): Map<K, number> {
  const totals = new Map<K, number>();
  for (const item of items) totals.set(key(item), (totals.get(key(item)) ?? 0) + value(item));
  return totals;
}

export const compareNewestFirst = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function toTransactionViews(
  transactions: Transaction[],
  refs: { wallets: Wallet[]; categories: Category[]; vehicles: Vehicle[] },
): TransactionView[] {
  const wallets = new Map(refs.wallets.map((w) => [w.id, w]));
  const categories = new Map(refs.categories.map((c) => [c.id, c]));
  const vehicles = new Map(refs.vehicles.map((v) => [v.id, v]));
  return [...transactions].sort(compareNewestFirst).map((t) => {
    const category = t.categoryId ? categories.get(t.categoryId) : undefined;
    return {
      ...t,
      categoryName: category?.name ?? null,
      categoryIcon: category?.icon ?? null,
      walletName: wallets.get(t.walletId)?.name ?? "?",
      toWalletName: t.toWalletId ? (wallets.get(t.toWalletId)?.name ?? "?") : null,
      vehicleName: t.vehicleId ? (vehicles.get(t.vehicleId)?.name ?? null) : null,
    };
  });
}
