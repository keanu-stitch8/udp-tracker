// OAuth Google akun pengguna (spec §6.2), diadaptasi dari mkk-dashboard `lib/connectors/google-oauth.ts`.
// OAuth client dipakai bersama mkk-dashboard → putuskan hanya menghapus token di DB, tidak mencabut di Google
// (pencabutan berlaku untuk semua izin client itu di akun yang sama, termasuk milik dashboard).
import "server-only";
import { OAuth2Client } from "google-auth-library";
import type { Db } from "@/db/types";
import { decrypt, encrypt } from "@/lib/crypto";
import { ConflictError, ServiceUnavailableError } from "@/lib/errors";
import { deleteGoogleCredential, selectGoogleCredential, upsertGoogleCredential } from "../api/credentials-repo";
import type { GoogleAccount } from "../types/google";

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const SCOPES = [DRIVE_FILE_SCOPE, "openid", "email"];

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

/** Halaman consent Google; offline + consent → selalu dapat refresh token. */
export function authUrl(origin: string, state: string): string {
  return oauthClient(origin).generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES, include_granted_scopes: false, state });
}

export async function saveGoogleToken(db: Db, token: StoredGoogleToken): Promise<void> {
  await upsertGoogleCredential(db, { data: encrypt(JSON.stringify(token)), account: token.email });
}

/** Tukar authorization code → simpan refresh token terenkripsi. Mengembalikan email akun. */
export async function completeOAuth(db: Db, code: string, origin: string): Promise<string | null> {
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
  await saveGoogleToken(db, { refresh_token: tokens.refresh_token, scope: tokens.scope ?? "", email });
  return email;
}

export async function googleAccount(db: Db): Promise<GoogleAccount> {
  const row = await selectGoogleCredential(db);
  return { connected: !!row, account: row?.account ?? null };
}

/** OAuth2Client dengan refresh token terpasang. Belum terhubung → 409 dengan arahan. */
export async function authorizedClient(db: Db): Promise<OAuth2Client> {
  const row = await selectGoogleCredential(db);
  if (!row) throw new ConflictError("Akun Google belum terhubung. Hubungkan dulu di Lainnya → Ekspor laporan.");
  const token = JSON.parse(decrypt(row.data)) as StoredGoogleToken;
  const client = oauthClient();
  client.setCredentials({ refresh_token: token.refresh_token });
  return client;
}

export async function disconnectGoogle(db: Db): Promise<void> {
  await deleteGoogleCredential(db);
}
