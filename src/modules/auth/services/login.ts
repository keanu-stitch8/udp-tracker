import "server-only";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import type { Db } from "@/db/types";
import { TooManyRequestsError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { countFailedAttemptsSince, insertLoginAttempt } from "../api/login-attempts-repo";

export const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const loginSchema = z.object({ password: z.string({ error: "Password wajib diisi." }).min(1, "Password wajib diisi.") });

/** Cek password aplikasi (spec §7). Gagal → ValidationError; terlalu banyak gagal per IP → TooManyRequestsError. */
export async function login(db: Db, input: unknown, context: { ip: string; passwordHash: string; now?: Date }): Promise<void> {
  const { password } = parseOrThrow(loginSchema, input);
  const now = context.now ?? new Date();
  const failures = await countFailedAttemptsSince(db, context.ip, new Date(now.getTime() - LOCKOUT_WINDOW_MS));
  if (failures >= MAX_FAILED_ATTEMPTS) {
    throw new TooManyRequestsError("Terlalu banyak percobaan gagal. Coba lagi 15 menit lagi.");
  }
  const ok = await verify(context.passwordHash, password).catch(() => false);
  await insertLoginAttempt(db, { ip: context.ip, success: ok, attemptedAt: now });
  if (!ok) throw new ValidationError({ password: ["Password salah."] }, "Password salah.");
}
