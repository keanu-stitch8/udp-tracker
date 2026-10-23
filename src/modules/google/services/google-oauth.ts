// OAuth Google: login (scope profil) dan koneksi ekspor per user (scope Drive), diadaptasi dari mkk-dashboard
// `lib/connectors/google-oauth.ts`. Keduanya memakai satu redirect URI (`/api/auth/google/callback`).
// OAuth client dipakai bersama mkk-dashboard → putuskan hanya menghapus token di DB, tidak mencabut di Google
// (pencabutan berlaku untuk semua izin client itu di akun yang sama, termasuk milik dashboard).
import "server-only";
import { OAuth2Client } from "google-auth-library";
import type { Db } from "@/db/types";
import { decrypt, encrypt } from "@/lib/crypto";
import { ConflictError, ServiceUnavailableError } from "@/lib/errors";
import { deleteGoogleCredential, selectGoogleCredential, upsertGoogleCredential } from "../api/credentials-repo";
import type { GoogleProfile } from "@/modules/users/services/sign-in";
import type { GoogleAccount } from "../types/google";

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const CONNECT_SCOPES = [DRIVE_FILE_SCOPE, "openid", "email"];
// Login tidak pernah meminta Drive: anggota tidak dimintai izin yang tidak mereka perlukan.
const LOGIN_SCOPES = ["openid", "email", "profile"];

export interface StoredGoogleToken {
  refresh_token: string;
  scope: string;
  email: string | null;
}

function oauthEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new ServiceUnavailableError("Akun Google belum dikonfigurasi (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET).");
  return { clientId, clientSecret };
}

/** Harus terdaftar persis di OAuth client Google Cloud. */
export function redirectUri(origin: string): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || `${origin}/api/auth/google/callback`;
}

function oauthClient(origin?: string): OAuth2Client {
  const { clientId, clientSecret } = oauthEnv();
  return new OAuth2Client({ clientId, clientSecret, redirectUri: origin ? redirectUri(origin) : undefined });
}

/** Halaman consent Google untuk ekspor; offline + consent → selalu dapat refresh token. */
export function authUrl(origin: string, state: string): string {
  return oauthClient(origin).generateAuthUrl({ access_type: "offline", prompt: "consent", scope: CONNECT_SCOPES, include_granted_scopes: false, state });
}

/** Halaman pilih akun Google untuk login (tanpa refresh token). */
export function loginAuthUrl(origin: string, state: string): string {
  return oauthClient(origin).generateAuthUrl({ prompt: "select_account", scope: LOGIN_SCOPES, state });
}

/** Tukar code login → profil dari id_token yang sudah diverifikasi tanda tangan & audience-nya. */
export async function googleProfileFromCode(code: string, origin: string): Promise<GoogleProfile> {
  const client = oauthClient(origin);
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new ConflictError("Google tidak mengirim identitas akun. Coba masuk lagi.");
  const payload = (await client.verifyIdToken({ idToken: tokens.id_token, audience: oauthEnv().clientId })).getPayload();
  if (!payload?.email) throw new ConflictError("Akun Google tidak punya email. Coba akun lain.");
  return { email: payload.email, emailVerified: payload.email_verified === true, name: payload.name ?? null, picture: payload.picture ?? null };
}

export async function saveGoogleToken(db: Db, userId: string, token: StoredGoogleToken): Promise<void> {
  await upsertGoogleCredential(db, userId, { data: encrypt(JSON.stringify(token)), account: token.email });
}

/** Tukar authorization code → simpan refresh token terenkripsi milik user. Mengembalikan email akun. */
export async function completeOAuth(db: Db, userId: string, code: string, origin: string): Promise<string | null> {
  const client = oauthClient(origin);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new ConflictError("Google tidak mengirim refresh token. Cabut akses app di myaccount.google.com/permissions, lalu hubungkan ulang.");
  }
  if (!(tokens.scope ?? "").split(/\s+/).includes(DRIVE_FILE_SCOPE)) {
    throw new ConflictError("Izin Google Drive tidak dicentang di layar consent. Hubungkan ulang dan centang semua izin.");
  }
  let email: string | null = null;
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: oauthEnv().clientId });
    email = ticket.getPayload()?.email ?? null;
  }
  await saveGoogleToken(db, userId, { refresh_token: tokens.refresh_token, scope: tokens.scope ?? "", email });
  return email;
}

export async function googleAccount(db: Db, userId: string): Promise<GoogleAccount> {
  const row = await selectGoogleCredential(db, userId);
  return { connected: !!row, account: row?.account ?? null };
}

/** OAuth2Client dengan refresh token terpasang. Belum terhubung → 409 dengan arahan. */
export async function authorizedClient(db: Db, userId: string): Promise<OAuth2Client> {
  const row = await selectGoogleCredential(db, userId);
  if (!row) throw new ConflictError("Akun Google belum terhubung. Hubungkan dulu di Lainnya → Ekspor laporan.");
  const token = JSON.parse(decrypt(row.data)) as StoredGoogleToken;
  const client = oauthClient();
  client.setCredentials({ refresh_token: token.refresh_token });
  return client;
}

export async function disconnectGoogle(db: Db, userId: string): Promise<void> {
  await deleteGoogleCredential(db, userId);
}
