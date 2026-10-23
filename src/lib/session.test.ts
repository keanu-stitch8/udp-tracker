import { describe, expect, it } from "vitest";
import { createSessionToken, SESSION_MAX_AGE, verifySessionToken } from "./session";

const secret = "s".repeat(32);
const now = Date.UTC(2026, 9, 21);
const uid = "3f1c2a40-0000-4000-8000-000000000001";

describe("session token", () => {
  it("token baru valid dan mengembalikan id user", async () => {
    const token = await createSessionToken(secret, uid, now);
    expect(await verifySessionToken(token, secret, now + 1000)).toBe(uid);
  });
  it("kedaluwarsa setelah SESSION_MAX_AGE", async () => {
    const token = await createSessionToken(secret, uid, now);
    expect(await verifySessionToken(token, secret, now + SESSION_MAX_AGE * 1000 + 1)).toBeNull();
  });
  it("menolak secret lain, payload diubah, token rusak, dan secret kosong", async () => {
    const token = await createSessionToken(secret, uid, now);
    expect(await verifySessionToken(token, "t".repeat(32), now)).toBeNull();
    const [, sig] = token.split(".");
    const forged = `${btoa(JSON.stringify({ uid: "lain", exp: now * 2 })).replace(/=+$/, "")}.${sig}`;
    expect(await verifySessionToken(forged, secret, now)).toBeNull();
    expect(await verifySessionToken("bukan-token", secret, now)).toBeNull();
    expect(await verifySessionToken(undefined, secret, now)).toBeNull();
    expect(await verifySessionToken(token, "", now)).toBeNull();
  });
  it("token lama tanpa uid (login password) tidak berlaku lagi", async () => {
    const payload = btoa(JSON.stringify({ exp: now + 1000 })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
    const sig = btoa(String.fromCharCode(...signature)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(await verifySessionToken(`${payload}.${sig}`, secret, now)).toBeNull();
  });
});
