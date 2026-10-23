import "server-only";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectProjectMemberRows } from "@/modules/members/api/members-repo";
import type { Actor } from "@/modules/users/types/user";
import { insertWalletHolders, revokeWalletHolders, selectActiveHolderIds } from "../api/holders-repo";
import { findWalletOrThrow } from "../services/wallets";
import { walletHoldersInputSchema } from "../types/wallet-holders-input";

/**
 * Atur pemegang dompet (spec pemegang dompet): yang tidak lagi ada di daftar dicabut (riwayat tetap), yang baru ditugaskan.
 * Pemegang harus anggota proyek; Root/PM tidak perlu memegang.
 */
export async function setWalletHolders(db: Db, actor: Actor, projectId: string, walletId: string, input: unknown): Promise<void> {
  await findWalletOrThrow(db, projectId, walletId);
  const userIds = [...new Set(parseOrThrow(walletHoldersInputSchema, input).userIds)];
  const memberIds = new Set((await selectProjectMemberRows(db, projectId)).map((m) => m.userId));
  if (userIds.some((id) => !memberIds.has(id))) throw new ValidationError({ userIds: ["Pemegang harus anggota proyek."] }, "Pemegang harus anggota proyek.");
  await db.transaction(async (tx) => {
    const current = (await selectActiveHolderIds(tx, walletId)).map((h) => h.userId);
    await revokeWalletHolders(
      tx,
      walletId,
      current.filter((id) => !userIds.includes(id)),
      { by: actor.id, reason: "revoked" },
    );
    await insertWalletHolders(
      tx,
      walletId,
      userIds.filter((id) => !current.includes(id)),
      actor.id,
    );
  });
}
