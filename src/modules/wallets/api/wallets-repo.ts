import "server-only";
import { wallets } from "@/db/schema";
import type { Db } from "@/db/types";

export type WalletRow = typeof wallets.$inferSelect;

export async function insertWallets(db: Db, values: (typeof wallets.$inferInsert)[]): Promise<WalletRow[]> {
  if (!values.length) return [];
  return db.insert(wallets).values(values).returning();
}
