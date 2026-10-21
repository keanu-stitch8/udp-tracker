import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { wallets } from "@/db/schema";
import type { Db } from "@/db/types";

export type WalletRow = typeof wallets.$inferSelect;

export async function insertWallets(db: Db, values: (typeof wallets.$inferInsert)[]): Promise<WalletRow[]> {
  if (!values.length) return [];
  return db.insert(wallets).values(values).returning();
}

export function selectWallets(db: Db, projectId: string): Promise<WalletRow[]> {
  return db.select().from(wallets).where(eq(wallets.projectId, projectId)).orderBy(asc(wallets.sortOrder));
}

export async function selectWallet(db: Db, projectId: string, id: string): Promise<WalletRow | undefined> {
  const [row] = await db.select().from(wallets).where(and(eq(wallets.projectId, projectId), eq(wallets.id, id)));
  return row;
}

export async function updateWalletRow(db: Db, id: string, patch: Partial<typeof wallets.$inferInsert>): Promise<WalletRow> {
  const [row] = await db.update(wallets).set(patch).where(eq(wallets.id, id)).returning();
  return row;
}

export async function deleteWalletRows(db: Db, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await db.delete(wallets).where(inArray(wallets.id, ids));
}
