import "server-only";
import { del, get, put } from "@vercel/blob";

/** Store Blob private (terbukti 2026-10-21): file dibaca lewat route app yang mengecek sesi. */
export async function putReceipt(pathname: string, body: Blob, contentType: string) {
  return put(pathname, body, { access: "private", contentType, addRandomSuffix: false });
}

export async function readReceipt(pathname: string) {
  return get(pathname, { access: "private" });
}

/** Best effort: gagal hapus hanya dicatat, blob yatim dibersihkan `npm run blob:cleanup`. */
export async function deleteReceipts(pathnames: string[]): Promise<void> {
  if (!pathnames.length) return;
  await del(pathnames).catch((error) => console.error("[blob] gagal hapus", pathnames.length, error));
}
