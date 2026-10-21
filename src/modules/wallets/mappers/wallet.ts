import type { WalletRow } from "../api/wallets-repo";
import type { Wallet } from "../types/wallet";

export function toWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    holder: row.holder,
    vehicleId: row.vehicleId,
    openingBalance: row.openingBalance,
    archived: row.archived,
  };
}
