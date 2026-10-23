import { z } from "zod";
import { safeNextPath } from "@/modules/auth/lib/safe-next";

// Cookie `state` OAuth (cegah CSRF): dibuat di /login atau /start, dicocokkan lalu dihapus di /callback.
// Login dan hubungkan-ekspor berbagi satu redirect URI; `purpose` menentukan alur di callback.
export const OAUTH_STATE_COOKIE = "google_oauth_state";

export const oauthStateCookie = (secure: boolean) => ({ httpOnly: true, sameSite: "lax" as const, secure, path: "/api/auth/google", maxAge: 600 });

const stateSchema = z.object({ purpose: z.enum(["login", "connect"]), nonce: z.string().min(1), next: z.string() });
export type OAuthState = z.infer<typeof stateSchema>;

export function encodeOAuthState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

/** Nilai cookie → state, atau null bila tidak ada/rusak. `next` selalu path internal. */
export function readOAuthState(value: string | undefined): OAuthState | null {
  if (!value) return null;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? { ...parsed.data, next: safeNextPath(parsed.data.next) } : null;
  } catch {
    return null;
  }
}

/** Kembali ke halaman ekspor dengan hasil untuk toast. */
export function exportPageUrl(origin: string, result: { ok: true } | { ok: false; message: string }): URL {
  const url = new URL("/lainnya/ekspor", origin);
  url.searchParams.set("google", result.ok ? "ok" : "error");
  if (!result.ok) url.searchParams.set("pesan", result.message);
  return url;
}

/** Login gagal → halaman login dengan pesan. */
export function loginPageUrl(origin: string, message: string): URL {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  return url;
}
