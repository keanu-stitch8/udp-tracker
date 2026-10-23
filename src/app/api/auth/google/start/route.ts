import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { route } from "@/lib/http";
import { encodeOAuthState, exportPageUrl, OAUTH_STATE_COOKIE, oauthStateCookie } from "@/modules/google/lib/oauth-state";
import { authUrl } from "@/modules/google/services/google-oauth";

/** Hubungkan Google untuk ekspor. Dibuka sebagai link (navigasi penuh), jadi error dikembalikan ke halaman ekspor, bukan JSON. */
export const GET = route(async (request) => {
  const origin = new URL(request.url).origin;
  const nonce = randomBytes(24).toString("base64url");
  try {
    const response = NextResponse.redirect(authUrl(origin, nonce));
    response.cookies.set(OAUTH_STATE_COOKIE, encodeOAuthState({ purpose: "connect", nonce, next: "/lainnya/ekspor" }), oauthStateCookie(origin.startsWith("https:")));
    return response;
  } catch (error) {
    if (error instanceof AppError) return NextResponse.redirect(exportPageUrl(origin, { ok: false, message: error.message }));
    throw error;
  }
});
