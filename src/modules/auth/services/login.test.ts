import { hash } from "@node-rs/argon2";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { TooManyRequestsError, ValidationError } from "@/lib/errors";
import { createTestDb } from "@tests/helpers/test-db";
import { login, MAX_FAILED_ATTEMPTS } from "./login";

let passwordHash: string;
let db: Db;
const now = new Date("2026-10-21T03:00:00Z");

beforeAll(async () => {
  passwordHash = await hash("rahasia-kudus");
});
beforeEach(async () => {
  db = await createTestDb();
});

describe("login", () => {
  it("password benar → berhasil", async () => {
    await expect(login(db, { password: "rahasia-kudus" }, { ip: "1.1.1.1", passwordHash, now })).resolves.toBeUndefined();
  });

  it("password salah → ValidationError di field password", async () => {
    const error = await login(db, { password: "salah" }, { ip: "1.1.1.1", passwordHash, now }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({ password: ["Password salah."] });
  });

  it("body tanpa password → ValidationError", async () => {
    await expect(login(db, {}, { ip: "1.1.1.1", passwordHash, now })).rejects.toBeInstanceOf(ValidationError);
  });

  it(`dikunci setelah ${MAX_FAILED_ATTEMPTS} gagal dalam 15 menit, per IP`, async () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await login(db, { password: "salah" }, { ip: "2.2.2.2", passwordHash, now }).catch(() => {});
    }
    await expect(login(db, { password: "rahasia-kudus" }, { ip: "2.2.2.2", passwordHash, now })).rejects.toBeInstanceOf(TooManyRequestsError);
    await expect(login(db, { password: "rahasia-kudus" }, { ip: "3.3.3.3", passwordHash, now })).resolves.toBeUndefined();
    const later = new Date(now.getTime() + 15 * 60 * 1000 + 1);
    await expect(login(db, { password: "rahasia-kudus" }, { ip: "2.2.2.2", passwordHash, now: later })).resolves.toBeUndefined();
  });
});
