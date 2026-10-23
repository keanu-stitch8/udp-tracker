import "server-only";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectProjectMemberRows } from "@/modules/members/api/members-repo";
import { replaceWalletHolders } from "../api/holders-repo";
import { findWalletOrThrow } from "../services/wallets";
import { walletHoldersInputSchema } from "../types/wallet-holders-input";

/** Ganti seluruh pemegang dompet (spec pemegang dompet). Pemegang harus anggota proyek; Root/PM tidak perlu memegang. */
export async function setWalletHolders(db: Db, projectId: string, walletId: string, input: unknown): Promise<void> {
  await findWalletOrThrow(db, projectId, walletId);
  const userIds = [...new Set(parseOrThrow(walletHoldersInputSchema, input).userIds)];
  const memberIds = new Set((await selectProjectMemberRows(db, projectId)).map((m) => m.userId));
  if (userIds.some((id) => !memberIds.has(id))) throw new ValidationError({ userIds: ["Pemegang harus anggota proyek."] }, "Pemegang harus anggota proyek.");
  await replaceWalletHolders(db, walletId, userIds);
}
