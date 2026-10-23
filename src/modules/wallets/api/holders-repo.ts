import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { users, walletHolders, wallets } from "@/db/schema";
import type { Db } from "@/db/types";

/** Pemegang semua dompet proyek, beserta nama (fallback email). */
export function selectProjectWalletHolders(db: Db, projectId: string) {
  return db
    .select({ walletId: walletHolders.walletId, userId: users.id, name: users.name, email: users.email })
    .from(walletHolders)
    .innerJoin(wallets, eq(wallets.id, walletHolders.walletId))
    .innerJoin(users, eq(users.id, walletHolders.userId))
    .where(eq(wallets.projectId, projectId));
}

/** Dompet proyek yang dipegang user. */
export async function selectHeldWalletIds(db: Db, projectId: string, userId: string): Promise<string[]> {
  const rows = await db
    .select({ walletId: walletHolders.walletId })
    .from(walletHolders)
    .innerJoin(wallets, eq(wallets.id, walletHolders.walletId))
    .where(and(eq(wallets.projectId, projectId), eq(walletHolders.userId, userId)));
  return rows.map((r) => r.walletId);
}

/** Ganti seluruh pemegang satu dompet. */
export async function replaceWalletHolders(db: Db, walletId: string, userIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(walletHolders).where(eq(walletHolders.walletId, walletId));
    if (userIds.length) await tx.insert(walletHolders).values(userIds.map((userId) => ({ walletId, userId })));
  });
}

/** Anggota dikeluarkan dari proyek → pegangannya di proyek itu ikut hilang. */
export async function deleteHoldingsInProject(db: Db, projectId: string, userId: string): Promise<void> {
  const projectWallets = db.select({ id: wallets.id }).from(wallets).where(eq(wallets.projectId, projectId));
  await db.delete(walletHolders).where(and(eq(walletHolders.userId, userId), inArray(walletHolders.walletId, projectWallets)));
}
