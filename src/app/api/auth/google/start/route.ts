import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { route } from "@/lib/http";
import { exportPageUrl, OAUTH_STATE_COOKIE, oauthStateCookie } from "@/modules/google/lib/oauth-state";
import { authUrl } from "@/modules/google/services/google-oauth";

/** Dibuka sebagai link (navigasi penuh), jadi error dikembalikan ke halaman ekspor, bukan JSON. */
export const GET = route(async (request) => {
  const origin = new URL(request.url).origin;
  const state = randomBytes(24).toString("base64url");
  try {
    const response = NextResponse.redirect(authUrl(origin, state));
    response.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookie(origin.startsWith("https:")));
    return response;
  } catch (error) {
    if (error instanceof AppError) return NextResponse.redirect(exportPageUrl(origin, { ok: false, message: error.message }));
    throw error;
  }
});
