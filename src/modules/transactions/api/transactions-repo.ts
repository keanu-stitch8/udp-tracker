import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { transactions } from "@/db/schema";
import type { Db } from "@/db/types";

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;

/** Transaksi aktif (belum dihapus) proyek, terbaru dulu. */
export function selectTransactions(db: Db, projectId: string): Promise<TransactionRow[]> {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.projectId, projectId), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

/** Termasuk yang sudah dihapus (dipakai untuk urungkan). */
export async function selectTransaction(db: Db, projectId: string, id: string): Promise<TransactionRow | undefined> {
  const [row] = await db.select().from(transactions).where(and(eq(transactions.projectId, projectId), eq(transactions.id, id)));
  return row;
}

export async function insertTransaction(db: Db, values: NewTransactionRow): Promise<TransactionRow> {
  const [row] = await db.insert(transactions).values(values).returning();
  return row;
}

export async function updateTransactionRow(db: Db, id: string, patch: Partial<NewTransactionRow>): Promise<TransactionRow> {
  const [row] = await db.update(transactions).set(patch).where(eq(transactions.id, id)).returning();
  return row;
}
