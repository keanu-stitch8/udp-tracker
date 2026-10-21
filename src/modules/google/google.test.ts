import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { googleCredentials } from "@/db/schema";
import { createTestDb } from "@tests/helpers/test-db";
import { disconnectGoogle, googleAccount, saveGoogleToken } from "./services/google-oauth";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("akun Google", () => {
  it("token tersimpan terenkripsi; status terhubung; putuskan menghapus baris", async () => {
    const db = await createTestDb();
    expect(await googleAccount(db)).toEqual({ connected: false, account: null });

    await saveGoogleToken(db, { refresh_token: "1//rahasia", scope: "https://www.googleapis.com/auth/drive.file", email: "riski@example.com" });
    expect(await googleAccount(db)).toEqual({ connected: true, account: "riski@example.com" });
    const [row] = await db.select().from(googleCredentials);
    expect(row.data).not.toContain("rahasia");

    await saveGoogleToken(db, { refresh_token: "1//baru", scope: "x", email: "lain@example.com" });
    expect(await db.select().from(googleCredentials)).toHaveLength(1);

    await disconnectGoogle(db);
    expect(await googleAccount(db)).toEqual({ connected: false, account: null });
  });
});
