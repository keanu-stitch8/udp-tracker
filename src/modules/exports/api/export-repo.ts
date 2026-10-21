import "server-only";
import { eq, inArray } from "drizzle-orm";
import { attachments, projects, transactions } from "@/db/schema";
import type { Db } from "@/db/types";

export async function selectProjectExport(db: Db, projectId: string) {
  const [row] = await db
    .select({ name: projects.name, driveFolderId: projects.driveFolderId, sheetId: projects.sheetId, sheetUrl: projects.sheetUrl })
    .from(projects)
    .where(eq(projects.id, projectId));
  return row;
}

export async function updateProjectExport(db: Db, projectId: string, patch: { driveFolderId?: string; sheetId?: string; sheetUrl?: string }): Promise<void> {
  await db.update(projects).set(patch).where(eq(projects.id, projectId));
}

export async function updateAttachmentDrive(db: Db, id: string, file: { driveFileId: string | null; driveUrl: string | null }): Promise<void> {
  await db.update(attachments).set(file).where(eq(attachments.id, id));
}

/** Folder proyek dibuat ulang (yang lama hilang) → semua foto perlu diunggah lagi. */
export async function clearProjectAttachmentsDrive(db: Db, projectId: string): Promise<void> {
  const ids = db.select({ id: transactions.id }).from(transactions).where(eq(transactions.projectId, projectId));
  await db.update(attachments).set({ driveFileId: null, driveUrl: null }).where(inArray(attachments.transactionId, ids));
}
