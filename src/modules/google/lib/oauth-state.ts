// Cookie `state` OAuth (cegah CSRF): dibuat di /start, dicocokkan lalu dihapus di /callback.
export const OAUTH_STATE_COOKIE = "google_oauth_state";

export const oauthStateCookie = (secure: boolean) => ({ httpOnly: true, sameSite: "lax" as const, secure, path: "/api/auth/google", maxAge: 600 });

/** Kembali ke halaman ekspor dengan hasil untuk toast. */
export function exportPageUrl(origin: string, result: { ok: true } | { ok: false; message: string }): URL {
  const url = new URL("/lainnya/ekspor", origin);
  url.searchParams.set("google", result.ok ? "ok" : "error");
  if (!result.ok) url.searchParams.set("pesan", result.message);
  return url;
}
