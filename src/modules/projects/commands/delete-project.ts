import "server-only";
import type { Db } from "@/db/types";
import { login } from "@/modules/auth/services/login";
import { selectProjectAttachments } from "@/modules/receipts/api/attachments-repo";
import { deleteReceipts } from "@/modules/receipts/api/blob";
import { deleteProjectTransactions } from "@/modules/transactions/api/transactions-repo";
import { deleteProjectRow } from "../api/projects-repo";
import { findProjectOrThrow } from "../services/projects";

/**
 * Hapus permanen proyek beserta seluruh datanya. Wajib password admin (= password aplikasi), diverifikasi lewat
 * `login()` sehingga ikut rate limit 5 gagal/15 menit per IP. Proyek selesai pun boleh dihapus. Foto bon di Blob dihapus
 * setelah commit (best effort; sisa yatim dibersihkan `npm run blob:cleanup`).
 */
export async function deleteProject(db: Db, id: string, input: unknown, context: { ip: string; passwordHash: string }): Promise<void> {
  await findProjectOrThrow(db, id);
  await login(db, input, context);
  const pathnames = (await selectProjectAttachments(db, id)).map((a) => a.blobPathname);
  await db.transaction(async (tx) => {
    await deleteProjectTransactions(tx, id);
    await deleteProjectRow(tx, id);
  });
  if (pathnames.length) await deleteReceipts(pathnames);
}
