// Ringkasan riwayat satu orang di satu proyek (spec profil riwayat). Murni: dipakai query profil.
import type { Category } from "@/modules/budgets/types/category";
import { sum } from "@/modules/shared/lib/money";
import { expenseEntries, sumBy } from "@/modules/transactions/lib/ledger";
import type { Transaction } from "@/modules/transactions/types/transaction";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { Wallet } from "@/modules/wallets/types/wallet";
import type { WalletHolderRecord } from "@/modules/wallets/types/wallet-holder";
import type { HeldWalletSummary, InputSummary } from "../types/history";

/** Uang masuk/keluar satu dompet, konsisten dengan `walletBalances`. */
export function walletFlows(walletId: string, transactions: Transaction[]): { moneyIn: number; moneyOut: number } {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const t of transactions) {
    if (t.type === "income" && t.walletId === walletId) moneyIn += t.amount;
    if (t.type !== "income" && t.walletId === walletId) moneyOut += t.amount + t.adminFee;
    if (t.type === "transfer" && t.toWalletId === walletId) moneyIn += t.amount;
  }
  return { moneyIn, moneyOut };
}

/** Dompet yang pernah dipegang `userId` (dari riwayat pegangan proyek), urut nama dompet sesuai daftar dompet. */
export function heldWallets(
  userId: string,
  refs: { wallets: Wallet[]; transactions: Transaction[]; holderHistory: WalletHolderRecord[]; lastCheckDifference: Map<string, number> },
): HeldWalletSummary[] {
  const balances = walletBalances(refs.wallets, refs.transactions);
  return refs.wallets.flatMap((w) => {
    const periods = refs.holderHistory.filter((h) => h.walletId === w.id && h.userId === userId);
    if (!periods.length) return [];
    return [
      {
        walletId: w.id,
        name: w.name,
        kind: w.kind,
        periods,
        openingBalance: w.openingBalance,
        ...walletFlows(w.id, refs.transactions),
        balance: balances.get(w.id) ?? w.openingBalance,
        lastCheckDifference: refs.lastCheckDifference.get(w.id) ?? null,
      },
    ];
  });
}

export function inputTransactions(userId: string, transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.createdBy === userId);
}

export function inputSummary(userId: string, transactions: Transaction[], categories: Category[]): InputSummary {
  const mine = inputTransactions(userId, transactions);
  return {
    count: mine.length,
    income: sum(mine.filter((t) => t.type === "income").map((t) => t.amount)),
    expense: sum(expenseEntries(mine, categories).map((e) => e.amount)),
  };
}

/** Pengeluaran yang dia input per kategori, terbesar dulu. */
export function inputByCategory(userId: string, transactions: Transaction[], categories: Category[]): { categoryId: string | null; name: string; amount: number }[] {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const totals = sumBy(
    expenseEntries(inputTransactions(userId, transactions), categories),
    (e) => e.categoryId,
    (e) => e.amount,
  );
  return [...totals]
    .map(([categoryId, amount]) => ({ categoryId, name: categoryId ? (names.get(categoryId) ?? "—") : "Tanpa kategori", amount }))
    .sort((a, b) => b.amount - a.amount);
}
