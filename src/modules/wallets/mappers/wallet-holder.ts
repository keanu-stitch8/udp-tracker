import type { selectProjectHolderHistory } from "../api/holders-repo";
import type { WalletHolderRecord } from "../types/wallet-holder";

type Row = Awaited<ReturnType<typeof selectProjectHolderHistory>>[number];

export function toWalletHolderRecord(row: Row): WalletHolderRecord {
  return {
    id: row.id,
    walletId: row.walletId,
    userId: row.userId,
    name: row.name ?? row.email,
    assignedAt: row.createdAt.toISOString(),
    assignedByName: row.assignedByName ?? row.assignedByEmail,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokedByName: row.revokedByName ?? row.revokedByEmail,
    revokeReason: row.revokeReason,
  };
}
