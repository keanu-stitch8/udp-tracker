import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { googleCredentials } from "@/db/schema";
import { createTestDb, createTestUser } from "@tests/helpers/test-db";
import { disconnectGoogle, googleAccount, saveGoogleToken } from "./services/google-oauth";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

const token = (email: string, refresh = "1//rahasia") => ({ refresh_token: refresh, scope: "https://www.googleapis.com/auth/drive.file", email });

describe("akun Google per user", () => {
  it("token tersimpan terenkripsi per user; putuskan satu user tidak menyentuh user lain", async () => {
    const db = await createTestDb();
    const a = await createTestUser(db, { email: "a@x.id", isRoot: true });
    const b = await createTestUser(db, { email: "b@x.id" });
    expect(await googleAccount(db, a.id)).toEqual({ connected: false, account: null });

    await saveGoogleToken(db, a.id, token("a@gmail.com"));
    await saveGoogleToken(db, b.id, token("b@gmail.com"));
    expect(await googleAccount(db, a.id)).toEqual({ connected: true, account: "a@gmail.com" });
    expect(await googleAccount(db, b.id)).toEqual({ connected: true, account: "b@gmail.com" });
    const rows = await db.select().from(googleCredentials);
    expect(rows.every((row) => !row.data.includes("rahasia"))).toBe(true);

    await saveGoogleToken(db, a.id, token("a2@gmail.com", "1//baru"));
    expect(await db.select().from(googleCredentials)).toHaveLength(2);
    expect(await googleAccount(db, a.id)).toEqual({ connected: true, account: "a2@gmail.com" });

    await disconnectGoogle(db, a.id);
    expect(await googleAccount(db, a.id)).toEqual({ connected: false, account: null });
    expect(await googleAccount(db, b.id)).toEqual({ connected: true, account: "b@gmail.com" });
  });
});
