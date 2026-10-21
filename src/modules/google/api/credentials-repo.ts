import "server-only";
import { eq } from "drizzle-orm";
import { googleCredentials } from "@/db/schema";
import type { Db } from "@/db/types";

// Satu akun Google untuk seluruh app (spec §3.1).
const ID = "default";

export type GoogleCredentialRow = typeof googleCredentials.$inferSelect;

export async function selectGoogleCredential(db: Db): Promise<GoogleCredentialRow | undefined> {
  const [row] = await db.select().from(googleCredentials).where(eq(googleCredentials.id, ID));
  return row;
}

export async function upsertGoogleCredential(db: Db, values: { data: string; account: string | null }): Promise<void> {
  await db
    .insert(googleCredentials)
    .values({ id: ID, ...values })
    .onConflictDoUpdate({ target: googleCredentials.id, set: { ...values, updatedAt: new Date() } });
}

export async function deleteGoogleCredential(db: Db): Promise<void> {
  await db.delete(googleCredentials).where(eq(googleCredentials.id, ID));
}
