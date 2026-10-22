import type { Transaction } from "@/modules/transactions/types/transaction";
import type { Wallet } from "../types/wallet";

/** Saldo per dompet (spec §3.3): awal + masuk − (keluar + admin) + transfer masuk − (transfer keluar + admin). `upTo` inklusif. */
export function walletBalances(wallets: Wallet[], transactions: Transaction[], upTo?: string): Map<string, number> {
  const balances = new Map(wallets.map((w) => [w.id, w.openingBalance]));
  const add = (id: string | null, delta: number) => {
    if (id && balances.has(id)) balances.set(id, balances.get(id)! + delta);
  };
  for (const t of transactions) {
    if (upTo && t.date > upTo) continue;
    if (t.type === "income") add(t.walletId, t.amount);
    else if (t.type === "expense") add(t.walletId, -(t.amount + t.adminFee));
    else {
      add(t.walletId, -(t.amount + t.adminFee));
      add(t.toWalletId, t.amount);
    }
  }
  return balances;
}

export interface BalancePoint {
  date: string;
  balance: number;
}

/** Saldo akhir hari satu dompet, hanya tanggal yang ada mutasinya, urut naik. */
export function dailyBalances(wallet: Wallet, transactions: Transaction[]): BalancePoint[] {
  const deltas = new Map<string, number>();
  const add = (date: string, delta: number) => deltas.set(date, (deltas.get(date) ?? 0) + delta);
  for (const t of transactions) {
    if (t.type === "income" && t.walletId === wallet.id) add(t.date, t.amount);
    else if (t.type === "expense" && t.walletId === wallet.id) add(t.date, -(t.amount + t.adminFee));
    else if (t.type === "transfer") {
      if (t.walletId === wallet.id) add(t.date, -(t.amount + t.adminFee));
      if (t.toWalletId === wallet.id) add(t.date, t.amount);
    }
  }
  let balance = wallet.openingBalance;
  return [...deltas.keys()].sort().map((date) => {
    balance += deltas.get(date)!;
    return { date, balance };
  });
}

/** Saldo s/d tanggal (inklusif) dari hasil dailyBalances. */
export function balanceAt(points: BalancePoint[], openingBalance: number, date: string): number {
  let balance = openingBalance;
  for (const point of points) {
    if (point.date > date) break;
    balance = point.balance;
  }
  return balance;
}
