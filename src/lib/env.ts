import "server-only";
import { z } from "zod";
import { ServiceUnavailableError } from "./errors";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "wajib diisi"),
  // Base64 karena hash argon2 berisi `$` yang diekspansi dotenv (.env.local).
  APP_PASSWORD_HASH: z
    .string()
    .min(1, "wajib diisi")
    .transform((b64) => Buffer.from(b64, "base64").toString("utf8"))
    .refine((hash) => hash.startsWith("$argon2"), "harus hasil `npm run hash-password`"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET minimal 32 karakter"),
});

export type Env = z.output<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Env tidak valid — ${detail}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Env tervalidasi, dibaca sekali saat pertama dipakai (bukan saat import, agar build tidak butuh secret). */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export interface ReceiptsEnv {
  /** null = scan dimatikan; upload bon tetap jalan. */
  geminiApiKey: string | null;
  /** Dicoba berurutan; model berikutnya dipakai bila model sebelumnya sibuk/kuota habis/timeout. */
  geminiModels: string[];
}

// Lite dulu: kuota/"high demand" model utama sering habis (2026-10-22, keputusan pengguna); flash jadi cadangan.
const DEFAULT_GEMINI_MODELS = ["gemini-flash-lite-latest"];

/** Env Rencana 3 dibaca terpisah agar app tetap jalan tanpa Blob/Gemini. SDK Blob membaca token sendiri dari process.env. */
export function receiptsEnv(source: Record<string, string | undefined> = process.env): ReceiptsEnv {
  if (!source.BLOB_READ_WRITE_TOKEN) throw new ServiceUnavailableError("Upload bon belum dikonfigurasi (BLOB_READ_WRITE_TOKEN).");
  const models = (source.GEMINI_MODEL ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return { geminiApiKey: source.GEMINI_API_KEY || null, geminiModels: models.length ? models : DEFAULT_GEMINI_MODELS };
}
