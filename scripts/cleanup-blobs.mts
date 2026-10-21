// Hapus foto bon yatim di Blob (diunggah tapi transaksinya batal disimpan, atau gagal terhapus). Spec §3.4.
// Default dry run; `npm run blob:cleanup -- --hapus` untuk benar-benar menghapus. Hanya file > 24 jam yang disentuh,
// agar foto yang sedang diisi di form (belum disimpan) tidak ikut terhapus.
import { del, list } from "@vercel/blob";
import { drizzle } from "drizzle-orm/node-postgres";
import { withVerifiedSsl } from "../src/db/connection-string";
import { attachments } from "../src/db/schema";

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local — pakai env proses
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url || !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("DATABASE_URL dan BLOB_READ_WRITE_TOKEN wajib di-set.");
  process.exit(1);
}

const apply = process.argv.includes("--hapus");
const cutoff = Date.now() - 24 * 60 * 60 * 1000;
const db = drizzle({ connection: withVerifiedSsl(url), casing: "snake_case" });
const used = new Set((await db.select({ pathname: attachments.blobPathname }).from(attachments)).map((r) => r.pathname));
await db.$client.end();

const orphans: string[] = [];
let cursor: string | undefined;
do {
  const page = await list({ prefix: "receipts/", cursor, limit: 1000 });
  for (const blob of page.blobs) {
    if (!used.has(blob.pathname) && blob.uploadedAt.getTime() < cutoff) orphans.push(blob.pathname);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

console.log(`${orphans.length} foto yatim (> 24 jam).`);
for (const pathname of orphans) console.log(`  ${pathname}`);
if (!orphans.length) process.exit(0);
if (!apply) {
  console.log("Dry run. Jalankan `npm run blob:cleanup -- --hapus` untuk menghapus.");
} else {
  for (let i = 0; i < orphans.length; i += 100) await del(orphans.slice(i, i + 100));
  console.log("Terhapus.");
}
