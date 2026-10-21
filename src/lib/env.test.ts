import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const hash = "$argon2id$v=19$m=19456,t=2,p=1$abc$def";
const valid = {
  DATABASE_URL: "postgres://u:p@host/db",
  APP_PASSWORD_HASH: Buffer.from(hash).toString("base64"),
  SESSION_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("men-decode APP_PASSWORD_HASH dari base64", () => {
    expect(parseEnv(valid).APP_PASSWORD_HASH).toBe(hash);
  });
  it("menolak env yang kurang/tidak valid dengan pesan jelas", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    expect(() => parseEnv({ ...valid, SESSION_SECRET: "pendek" })).toThrow(/SESSION_SECRET minimal 32 karakter/);
    expect(() => parseEnv({ ...valid, APP_PASSWORD_HASH: Buffer.from("plain").toString("base64") })).toThrow(/hash-password/);
  });
});
