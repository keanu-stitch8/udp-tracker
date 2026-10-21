import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { deleteAttachmentRows, insertAttachments, selectTransactionAttachments } from "../api/attachments-repo";
import { attachmentsInputSchema, type AttachmentInput } from "../types/attachment";

const inputSchema = z.object({ attachments: attachmentsInputSchema });

/** `undefined` = field tidak dikirim → lampiran tidak diubah. Lampiran harus berada di folder Blob proyek ini. */
export function planAttachments(input: unknown, projectId: string): AttachmentInput[] | undefined {
  const { attachments } = parseOrThrow(inputSchema, input);
  if (attachments?.some((a) => a.pathname.split("/")[1] !== projectId)) {
    throw new ValidationError({ attachments: ["Lampiran bukan milik proyek ini."] });
  }
  return attachments;
}

/** Samakan lampiran transaksi dengan daftar input (kunci: pathname). Mengembalikan pathname Blob yang perlu dihapus. */
export async function syncAttachments(db: Db, transactionId: string, wanted: AttachmentInput[]): Promise<string[]> {
  const existing = await selectTransactionAttachments(db, transactionId);
  const wantedPaths = new Set(wanted.map((a) => a.pathname));
  const existingPaths = new Set(existing.map((a) => a.blobPathname));
  const removed = existing.filter((a) => !wantedPaths.has(a.blobPathname));
  await deleteAttachmentRows(
    db,
    removed.map((a) => a.id),
  );
  await insertAttachments(
    db,
    wanted
      .filter((a) => !existingPaths.has(a.pathname))
      .map((a) => ({ transactionId, blobUrl: a.blobUrl, blobPathname: a.pathname, mimeType: a.mimeType, sizeBytes: a.sizeBytes, ocrJson: a.ocr })),
  );
  return removed.map((a) => a.blobPathname);
}
