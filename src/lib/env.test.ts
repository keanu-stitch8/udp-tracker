import { describe, expect, it } from "vitest";
import { parseEnv, receiptsEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://u:p@host/db",
  SESSION_SECRET: "x".repeat(32),
};

describe("parseEnv", () => {
  it("ROOT_EMAILS: dipisah koma, huruf kecil, kosong dibuang", () => {
    expect(parseEnv(valid).rootEmails).toEqual([]);
    expect(parseEnv({ ...valid, ROOT_EMAILS: " Riski@Example.com, ,b@example.com " }).rootEmails).toEqual(["riski@example.com", "b@example.com"]);
  });
  it("menolak env yang kurang/tidak valid dengan pesan jelas", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    expect(() => parseEnv({ ...valid, SESSION_SECRET: "pendek" })).toThrow(/SESSION_SECRET minimal 32 karakter/);
  });
});

describe("receiptsEnv", () => {
  it("default model scan: lite dulu (kuota model utama sering habis), flash sebagai cadangan", () => {
    expect(receiptsEnv({ BLOB_READ_WRITE_TOKEN: "x" }).geminiModels).toEqual(["gemini-flash-lite-latest"]);
    expect(receiptsEnv({ BLOB_READ_WRITE_TOKEN: "x", GEMINI_MODEL: "a, b" }).geminiModels).toEqual(["a", "b"]);
  });
});
