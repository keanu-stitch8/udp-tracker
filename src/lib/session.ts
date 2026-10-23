// Token sesi: base64url(JSON {uid, exp}) + "." + base64url(HMAC-SHA256). Hanya Web Crypto → bisa dipakai di proxy & route.
export const SESSION_COOKIE = "udp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // detik (30 hari)

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(secret: string, userId: string, now: number = Date.now()): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ uid: userId, exp: now + SESSION_MAX_AGE * 1000 })));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Id user dari token yang sah dan belum kedaluwarsa, atau null. Status/peran user dibaca dari DB, bukan dari token. */
export async function verifySessionToken(token: string | undefined, secret: string, now: number = Date.now()): Promise<string | null> {
  if (!token || !secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return null;
    const { uid, exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { uid?: unknown; exp?: unknown };
    return typeof uid === "string" && uid && typeof exp === "number" && exp > now ? uid : null;
  } catch {
    return null;
  }
}
