import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { publicRoute } from "@/lib/http";
import { encodeOAuthState, loginPageUrl, OAUTH_STATE_COOKIE, oauthStateCookie } from "@/modules/google/lib/oauth-state";
import { loginAuthUrl } from "@/modules/google/services/google-oauth";

/** Tombol "Masuk dengan Google" (navigasi penuh). `?next=` = halaman tujuan setelah login. */
export const GET = publicRoute(async (request) => {
  const url = new URL(request.url);
  const nonce = randomBytes(24).toString("base64url");
  try {
    const response = NextResponse.redirect(loginAuthUrl(url.origin, nonce));
    const state = encodeOAuthState({ purpose: "login", nonce, next: url.searchParams.get("next") ?? "/" });
    response.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookie(url.protocol === "https:"));
    return response;
  } catch (error) {
    if (error instanceof AppError) return NextResponse.redirect(loginPageUrl(url.origin, error.message));
    throw error;
  }
});
