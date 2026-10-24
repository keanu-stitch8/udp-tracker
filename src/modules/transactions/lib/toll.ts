// Riwayat tol (spec riwayat tol): tap yang sudah tercatat ditandai "Sudah tercatat" di panel impor.
import type { TollTap } from "@/modules/receipts/types/receipt";
import type { Transaction } from "../types/transaction";

export const tollKey = (tap: TollTap): string => `${tap.date} ${tap.time} ${tap.amount}`;

/** Kunci tap dari pengeluaran yang sudah ada di dompet ini. */
export function recordedTollKeys(transactions: Pick<Transaction, "type" | "walletId" | "date" | "time" | "amount">[], walletId: string): Set<string> {
  return new Set(transactions.filter((t) => t.type === "expense" && t.walletId === walletId).map(tollKey));
}
