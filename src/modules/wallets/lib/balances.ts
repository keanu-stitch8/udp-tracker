import type { Transaction } from "@/modules/transactions/types/transaction";
import type { Wallet } from "../types/wallet";

/** Saldo per dompet (spec §3.3): awal + masuk − keluar + transfer masuk − (transfer keluar + admin). `upTo` inklusif. */
export function walletBalances(wallets: Wallet[], transactions: Transaction[], upTo?: string): Map<string, number> {
  const balances = new Map(wallets.map((w) => [w.id, w.openingBalance]));
  const add = (id: string | null, delta: number) => {
    if (id && balances.has(id)) balances.set(id, balances.get(id)! + delta);
  };
  for (const t of transactions) {
    if (upTo && t.date > upTo) continue;
    if (t.type === "income") add(t.walletId, t.amount);
    else if (t.type === "expense") add(t.walletId, -t.amount);
    else {
      add(t.walletId, -(t.amount + t.adminFee));
      add(t.toWalletId, t.amount);
    }
  }
  return balances;
}
