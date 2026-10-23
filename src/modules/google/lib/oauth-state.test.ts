import { describe, expect, it } from "vitest";
import { encodeOAuthState, loginPageUrl, readOAuthState } from "./oauth-state";

describe("cookie state OAuth", () => {
  it("bolak-balik login dan connect", () => {
    expect(readOAuthState(encodeOAuthState({ purpose: "login", nonce: "n1", next: "/kalender?bulan=2026-10" }))).toEqual({ purpose: "login", nonce: "n1", next: "/kalender?bulan=2026-10" });
    expect(readOAuthState(encodeOAuthState({ purpose: "connect", nonce: "n2", next: "/" }))).toEqual({ purpose: "connect", nonce: "n2", next: "/" });
  });
  it("nilai rusak / cookie lama (string polos) → null; next tidak aman → /", () => {
    expect(readOAuthState(undefined)).toBeNull();
    expect(readOAuthState("abc123")).toBeNull();
    expect(readOAuthState(Buffer.from(JSON.stringify({ purpose: "lain", nonce: "x", next: "/" })).toString("base64url"))).toBeNull();
    expect(readOAuthState(Buffer.from(JSON.stringify({ purpose: "login", nonce: "x", next: "https://evil.example" })).toString("base64url"))?.next).toBe("/");
  });
  it("halaman login dengan pesan error", () => {
    expect(loginPageUrl("https://udp-tracker.vercel.app", "Akses ditolak.").toString()).toBe("https://udp-tracker.vercel.app/login?error=Akses+ditolak.");
  });
});
