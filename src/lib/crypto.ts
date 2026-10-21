// AES-256-GCM untuk refresh token Google di DB (spec §6.2). Diadaptasi dari mkk-dashboard `lib/crypto.ts`.
// ENCRYPTION_KEY: 32 byte dalam base64 atau hex. Buat dengan: openssl rand -base64 32
import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

function toKey(raw: string | undefined): Buffer {
  const value = raw?.trim();
  if (!value) throw new Error("ENCRYPTION_KEY belum diisi di env (buat dengan: openssl rand -base64 32).");
  const buf = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY harus 32 byte (44 karakter base64 atau 64 karakter hex).");
  return buf;
}

/** Hasil: "v1.<iv>.<authTag>.<ciphertext>" (base64url). */
export function encrypt(plain: string, key = process.env.ENCRYPTION_KEY): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, toKey(key), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(payload: string, key = process.env.ENCRYPTION_KEY): string {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Format kredensial terenkripsi tidak dikenal.");
  const decipher = createDecipheriv(ALGO, toKey(key), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  try {
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Kredensial tidak bisa dibuka — ENCRYPTION_KEY berubah? Hubungkan ulang akun Google.");
  }
}
