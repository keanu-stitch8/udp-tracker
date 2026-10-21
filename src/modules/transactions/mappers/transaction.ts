import type { TransactionRow } from "../api/transactions-repo";
import type { Transaction } from "../types/transaction";

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    amount: row.amount,
    categoryId: row.categoryId,
    walletId: row.walletId,
    toWalletId: row.toWalletId,
    adminFee: row.adminFee,
    vehicleId: row.vehicleId,
    merchant: row.merchant,
    note: row.note,
    balanceCheckId: row.balanceCheckId,
    createdAt: row.createdAt.toISOString(),
  };
}
