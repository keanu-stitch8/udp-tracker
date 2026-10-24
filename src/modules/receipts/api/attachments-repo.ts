import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { attachments, transactions } from "@/db/schema";
import type { Db } from "@/db/types";

export type AttachmentRow = typeof attachments.$inferSelect;
export type NewAttachmentRow = typeof attachments.$inferInsert;

/** Semua lampiran proyek, termasuk milik transaksi yang sudah dihapus (soft delete). */
export async function selectProjectAttachments(db: Db, projectId: string): Promise<AttachmentRow[]> {
  const rows = await db
    .select({ attachment: attachments })
    .from(attachments)
    .innerJoin(transactions, eq(attachments.transactionId, transactions.id))
    .where(eq(transactions.projectId, projectId))
    .orderBy(attachments.createdAt);
  return rows.map((r) => r.attachment);
}

export async function selectAttachment(db: Db, projectId: string, id: string): Promise<AttachmentRow | undefined> {
  const [row] = await db
    .select({ attachment: attachments })
    .from(attachments)
    .innerJoin(transactions, eq(attachments.transactionId, transactions.id))
    .where(and(eq(transactions.projectId, projectId), eq(attachments.id, id)));
  return row?.attachment;
}

export function selectTransactionAttachments(db: Db, transactionId: string): Promise<AttachmentRow[]> {
  return db.select().from(attachments).where(eq(attachments.transactionId, transactionId));
}

export async function insertAttachments(db: Db, values: NewAttachmentRow[]): Promise<void> {
  if (values.length) await db.insert(attachments).values(values);
}

/** Pathname yang masih dipakai baris lampiran mana pun (satu file bisa untuk banyak transaksi). */
export async function selectPathnamesInUse(db: Db, pathnames: string[]): Promise<Set<string>> {
  if (!pathnames.length) return new Set();
  const rows = await db.selectDistinct({ pathname: attachments.blobPathname }).from(attachments).where(inArray(attachments.blobPathname, pathnames));
  return new Set(rows.map((r) => r.pathname));
}

export async function deleteAttachmentRows(db: Db, ids: string[]): Promise<void> {
  if (ids.length) await db.delete(attachments).where(inArray(attachments.id, ids));
}
