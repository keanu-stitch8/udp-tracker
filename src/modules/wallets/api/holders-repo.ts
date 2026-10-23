import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { users, walletHolders, wallets } from "@/db/schema";
import type { Db } from "@/db/types";
import type { HolderRevokeReason } from "@/modules/shared/types/enums";

export type WalletHolderRow = typeof walletHolders.$inferSelect;

const active = isNull(walletHolders.revokedAt);
const assigner = alias(users, "assigner");
const revoker = alias(users, "revoker");

/** Semua periode pegangan dompet proyek (aktif & dicabut) beserta nama orang, penugas, dan pencabut; terbaru dulu. */
export function selectProjectHolderHistory(db: Db, projectId: string) {
  return db
    .select({
      id: walletHolders.id,
      walletId: walletHolders.walletId,
      userId: walletHolders.userId,
      name: users.name,
      email: users.email,
      createdAt: walletHolders.createdAt,
      assignedByName: assigner.name,
      assignedByEmail: assigner.email,
      revokedAt: walletHolders.revokedAt,
      revokedByName: revoker.name,
      revokedByEmail: revoker.email,
      revokeReason: walletHolders.revokeReason,
    })
    .from(walletHolders)
    .innerJoin(wallets, eq(wallets.id, walletHolders.walletId))
    .innerJoin(users, eq(users.id, walletHolders.userId))
    .leftJoin(assigner, eq(assigner.id, walletHolders.assignedBy))
    .leftJoin(revoker, eq(revoker.id, walletHolders.revokedBy))
    .where(eq(wallets.projectId, projectId))
    .orderBy(desc(walletHolders.createdAt));
}

/** Dompet proyek yang saat ini dipegang user (pegangan aktif). */
export async function selectHeldWalletIds(db: Db, projectId: string, userId: string): Promise<string[]> {
  const rows = await db
    .select({ walletId: walletHolders.walletId })
    .from(walletHolders)
    .innerJoin(wallets, eq(wallets.id, walletHolders.walletId))
    .where(and(eq(wallets.projectId, projectId), eq(walletHolders.userId, userId), active));
  return rows.map((r) => r.walletId);
}

export function selectActiveHolderIds(db: Db, walletId: string): Promise<{ userId: string }[]> {
  return db.select({ userId: walletHolders.userId }).from(walletHolders).where(and(eq(walletHolders.walletId, walletId), active));
}

export async function insertWalletHolders(db: Db, walletId: string, userIds: string[], assignedBy: string | null): Promise<void> {
  if (userIds.length) await db.insert(walletHolders).values(userIds.map((userId) => ({ walletId, userId, assignedBy })));
}

interface Revoke {
  by: string | null;
  reason: HolderRevokeReason;
  at?: Date;
}

const revokeValues = ({ by, reason, at = new Date() }: Revoke) => ({ revokedAt: at, revokedBy: by, revokeReason: reason });

/** Cabut pegangan aktif beberapa user pada satu dompet. Barisnya tetap ada sebagai riwayat. */
export async function revokeWalletHolders(db: Db, walletId: string, userIds: string[], revoke: Revoke): Promise<void> {
  if (!userIds.length) return;
  await db
    .update(walletHolders)
    .set(revokeValues(revoke))
    .where(and(eq(walletHolders.walletId, walletId), inArray(walletHolders.userId, userIds), active));
}

/** Anggota dikeluarkan dari proyek → semua pegangannya di proyek itu dicabut. */
export async function revokeHoldingsInProject(db: Db, projectId: string, userId: string, revoke: Revoke): Promise<void> {
  const projectWallets = db.select({ id: wallets.id }).from(wallets).where(eq(wallets.projectId, projectId));
  await db
    .update(walletHolders)
    .set(revokeValues(revoke))
    .where(and(eq(walletHolders.userId, userId), inArray(walletHolders.walletId, projectWallets), active));
}

/** Akun ditolak/dicabut → semua pegangan aktifnya dicabut. */
export async function revokeHoldingsOfUser(db: Db, userId: string, revoke: Revoke): Promise<void> {
  await db
    .update(walletHolders)
    .set(revokeValues(revoke))
    .where(and(eq(walletHolders.userId, userId), active));
}
