import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { assertNotViewingAs, publicRoute, requireUser } from "@/lib/http";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { googleErrorMessage } from "@/modules/google/lib/google-errors";
import { exportPageUrl, loginPageUrl, OAUTH_STATE_COOKIE, readOAuthState } from "@/modules/google/lib/oauth-state";
import { completeOAuth, googleProfileFromCode } from "@/modules/google/services/google-oauth";
import { VIEW_AS_COOKIE } from "@/modules/users/lib/view-as";
import { signInGoogleUser } from "@/modules/users/services/sign-in";

const errorMessage = (error: unknown) => (error instanceof AppError ? error.message : googleErrorMessage(error));

// Satu redirect URI untuk login dan hubungkan-ekspor; cookie state menentukan alurnya. Proxy mengizinkan path ini
// tanpa sesi (login), sedangkan alur hubungkan memeriksa sesi sendiri (cookie SameSite=Lax ikut pada redirect dari Google).
export const GET = publicRoute(async (request) => {
  const url = new URL(request.url);
  const store = await cookies();
  const state = readOAuthState(store.get(OAUTH_STATE_COOKIE)?.value);
  store.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/google" });

  const purpose = state?.purpose ?? (url.searchParams.get("scope")?.includes("drive") ? "connect" : "login");
  const fail = (message: string) => NextResponse.redirect(purpose === "connect" ? exportPageUrl(url.origin, { ok: false, message }) : loginPageUrl(url.origin, message));
  if (url.searchParams.get("error")) return fail("Akses Google dibatalkan.");
  const code = url.searchParams.get("code");
  if (!code || !state || url.searchParams.get("state") !== state.nonce) return fail("Sesi Google kedaluwarsa. Coba lagi.");

  const db = getDb();
  if (state.purpose === "connect") {
    try {
      // Token Google milik pemilik sesi, jangan tersimpan atas nama anggota yang sedang "dilihat".
      await assertNotViewingAs();
      const user = await requireUser();
      await completeOAuth(db, user.id, code, url.origin);
    } catch (error) {
      return fail(errorMessage(error));
    }
    return NextResponse.redirect(exportPageUrl(url.origin, { ok: true }));
  }

  let userId: string;
  try {
    const profile = await googleProfileFromCode(code, url.origin);
    userId = (await signInGoogleUser(db, profile, { rootEmails: env().rootEmails })).id;
  } catch (error) {
    return fail(errorMessage(error));
  }
  // Akun pending/ditolak tetap dapat sesi: layout menampilkan layar "Menunggu konfirmasi" / "Akses ditolak".
  store.set(SESSION_COOKIE, await createSessionToken(env().SESSION_SECRET, userId), {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  store.delete(VIEW_AS_COOKIE);
  return NextResponse.redirect(new URL(state.next, url.origin));
});
