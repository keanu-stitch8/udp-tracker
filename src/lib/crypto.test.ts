import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("crypto", () => {
  it("enkripsi bolak-balik, format v1.<iv>.<tag>.<data>", () => {
    const payload = encrypt("refresh-token-rahasia", key);
    expect(payload.split(".")).toHaveLength(4);
    expect(payload.startsWith("v1.")).toBe(true);
    expect(payload).not.toContain("refresh-token-rahasia");
    expect(decrypt(payload, key)).toBe("refresh-token-rahasia");
  });

  it("kunci hex 64 karakter juga diterima", () => {
    const hex = randomBytes(32).toString("hex");
    expect(decrypt(encrypt("x", hex), hex)).toBe("x");
  });

  it("kunci lain → error yang menyuruh hubungkan ulang", () => {
    const payload = encrypt("x", key);
    expect(() => decrypt(payload, randomBytes(32).toString("base64"))).toThrow(/ENCRYPTION_KEY berubah/);
  });

  it("kunci kosong atau bukan 32 byte → error jelas", () => {
    expect(() => encrypt("x", "")).toThrow(/ENCRYPTION_KEY belum diisi/);
    expect(() => encrypt("x", randomBytes(16).toString("base64"))).toThrow(/32 byte/);
  });
});
