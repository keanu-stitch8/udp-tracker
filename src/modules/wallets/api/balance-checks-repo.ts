import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { balanceChecks, wallets } from "@/db/schema";
import type { Db } from "@/db/types";

export type BalanceCheckRow = typeof balanceChecks.$inferSelect;

export async function insertBalanceCheck(db: Db, values: typeof balanceChecks.$inferInsert): Promise<BalanceCheckRow> {
  const [row] = await db.insert(balanceChecks).values(values).returning();
  return row;
}

/** Riwayat cek saldo satu dompet, terbaru dulu. */
export function selectBalanceChecks(db: Db, walletId: string): Promise<BalanceCheckRow[]> {
  return db.select().from(balanceChecks).where(eq(balanceChecks.walletId, walletId)).orderBy(desc(balanceChecks.date), desc(balanceChecks.createdAt));
}

/** Cek saldo milik proyek (kepemilikan lewat dompetnya). */
export async function selectBalanceCheck(db: Db, projectId: string, id: string): Promise<BalanceCheckRow | undefined> {
  const [row] = await db
    .select({ check: balanceChecks })
    .from(balanceChecks)
    .innerJoin(wallets, eq(wallets.id, balanceChecks.walletId))
    .where(and(eq(wallets.projectId, projectId), eq(balanceChecks.id, id)));
  return row?.check;
}
