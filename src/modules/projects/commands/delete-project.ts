import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectProjectAttachments } from "@/modules/receipts/api/attachments-repo";
import { deleteReceipts } from "@/modules/receipts/api/blob";
import { deleteProjectTransactions } from "@/modules/transactions/api/transactions-repo";
import { deleteProjectRow } from "../api/projects-repo";
import { findProjectOrThrow } from "../services/projects";

const confirmSchema = z.object({ name: z.string({ error: "Ketik nama proyek." }).trim().min(1, "Ketik nama proyek.") });

/**
 * Hapus permanen proyek beserta seluruh datanya. Konfirmasi = ketik ulang nama proyek (izin `manage` dicek route).
 * Proyek selesai pun boleh dihapus. Foto bon di Blob dihapus setelah commit (best effort; sisa yatim dibersihkan
 * `npm run blob:cleanup`).
 */
export async function deleteProject(db: Db, id: string, input: unknown): Promise<void> {
  const project = await findProjectOrThrow(db, id);
  const { name } = parseOrThrow(confirmSchema, input);
  if (name !== project.name.trim()) throw new ValidationError({ name: ["Nama proyek tidak cocok."] }, "Nama proyek tidak cocok.");
  const pathnames = [...new Set((await selectProjectAttachments(db, id)).map((a) => a.blobPathname))];
  await db.transaction(async (tx) => {
    await deleteProjectTransactions(tx, id);
    await deleteProjectRow(tx, id);
  });
  if (pathnames.length) await deleteReceipts(pathnames);
}
