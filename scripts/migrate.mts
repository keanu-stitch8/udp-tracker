// Jalankan migrasi Drizzle (lokal: env dari .env.local; Vercel: env project, via `vercel-build`).
// Pakai DATABASE_URL_UNPOOLED (koneksi langsung) — migrasi lewat pooler PgBouncer bisa gagal (skill Neon).
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { withVerifiedSsl } from "../src/db/connection-string";

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local — pakai env proses
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED/DATABASE_URL belum di-set (jalankan `neon env pull`).");
  process.exit(1);
}

const db = drizzle({ connection: withVerifiedSsl(url) });
await migrate(db, { migrationsFolder: "src/db/migrations" });
await db.$client.end();
console.log("Migrasi selesai.");
