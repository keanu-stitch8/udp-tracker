import { describe, expect, it } from "vitest";
import { createSessionToken, SESSION_MAX_AGE, verifySessionToken } from "./session";

const secret = "s".repeat(32);
const now = Date.UTC(2026, 9, 21);

describe("session token", () => {
  it("token baru valid", async () => {
    const token = await createSessionToken(secret, now);
    expect(await verifySessionToken(token, secret, now + 1000)).toBe(true);
  });
  it("kedaluwarsa setelah SESSION_MAX_AGE", async () => {
    const token = await createSessionToken(secret, now);
    expect(await verifySessionToken(token, secret, now + SESSION_MAX_AGE * 1000 + 1)).toBe(false);
  });
  it("menolak secret lain, payload diubah, token rusak, dan secret kosong", async () => {
    const token = await createSessionToken(secret, now);
    expect(await verifySessionToken(token, "t".repeat(32), now)).toBe(false);
    const [, sig] = token.split(".");
    const forged = `${btoa(JSON.stringify({ exp: now * 2 })).replace(/=+$/, "")}.${sig}`;
    expect(await verifySessionToken(forged, secret, now)).toBe(false);
    expect(await verifySessionToken("bukan-token", secret, now)).toBe(false);
    expect(await verifySessionToken(undefined, secret, now)).toBe(false);
    expect(await verifySessionToken(token, "", now)).toBe(false);
  });
});
