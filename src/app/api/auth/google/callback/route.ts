import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { AppError } from "@/lib/errors";
import { route } from "@/lib/http";
import { googleErrorMessage } from "@/modules/google/lib/google-errors";
import { exportPageUrl, OAUTH_STATE_COOKIE } from "@/modules/google/lib/oauth-state";
import { completeOAuth } from "@/modules/google/services/google-oauth";

// Proxy mengizinkan path ini; sesi tetap diperiksa route() (cookie SameSite=Lax ikut pada redirect dari Google).
export const GET = route(async (request) => {
  const url = new URL(request.url);
  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });

  const fail = (message: string) => NextResponse.redirect(exportPageUrl(url.origin, { ok: false, message }));
  if (url.searchParams.get("error")) return fail("Akses Google dibatalkan.");
  const code = url.searchParams.get("code");
  if (!code || !expected || url.searchParams.get("state") !== expected) return fail("Sesi menghubungkan Google kedaluwarsa. Coba hubungkan lagi.");

  try {
    await completeOAuth(getDb(), code, url.origin);
  } catch (error) {
    return fail(error instanceof AppError ? error.message : googleErrorMessage(error));
  }
  return NextResponse.redirect(exportPageUrl(url.origin, { ok: true }));
});
