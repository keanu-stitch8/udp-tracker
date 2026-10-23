import type { HolderRevokeReason } from "@/modules/shared/types/enums";

/** Satu periode pegangan dompet (spec pemegang dompet). `revokedAt` null = masih memegang. */
export interface WalletHolderRecord {
  id: string;
  walletId: string;
  userId: string;
  name: string;
  assignedAt: string;
  assignedByName: string | null;
  revokedAt: string | null;
  revokedByName: string | null;
  revokeReason: HolderRevokeReason | null;
}
