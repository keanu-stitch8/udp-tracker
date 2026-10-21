import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { selectAttachment } from "../api/attachments-repo";
import { readReceipt } from "../api/blob";

/** File lampiran dari Blob private; null bila lampiran bukan milik proyek atau file-nya sudah tidak ada. */
export async function getAttachmentFile(db: Db, projectId: string, id: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const row = z.uuid().safeParse(id).success ? await selectAttachment(db, projectId, id) : undefined;
  if (!row) return null;
  const result = await readReceipt(row.blobPathname);
  if (!result || result.statusCode !== 200) return null;
  return { stream: result.stream, contentType: row.mimeType };
}
