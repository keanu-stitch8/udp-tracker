import type { BalanceCheckRow } from "../api/balance-checks-repo";
import type { BalanceCheck } from "../types/balance-check";

export function toBalanceCheck(row: BalanceCheckRow, adjustmentId: string | null): BalanceCheck {
  return {
    id: row.id,
    walletId: row.walletId,
    date: row.date,
    actualBalance: row.actualBalance,
    computedBalance: row.computedBalance,
    difference: row.actualBalance - row.computedBalance,
    note: row.note,
    adjustmentId,
    createdAt: row.createdAt.toISOString(),
  };
}
