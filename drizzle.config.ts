import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // tidak ada .env.local (mis. di Vercel) — pakai env proses
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  casing: "snake_case",
  // Migrasi lewat koneksi langsung (tanpa -pooler): PgBouncer mode transaksi tidak cocok untuk DDL (skill Neon).
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
});
