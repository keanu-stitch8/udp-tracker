import "server-only";
import { asc, eq } from "drizzle-orm";
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
