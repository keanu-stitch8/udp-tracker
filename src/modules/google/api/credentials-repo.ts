import "server-only";
import { eq } from "drizzle-orm";
import { googleCredentials } from "@/db/schema";
import type { Db } from "@/db/types";

// Satu koneksi Google per user (spec akses §6): file ekspor masuk ke Drive orang yang mengekspor.

export type GoogleCredentialRow = typeof googleCredentials.$inferSelect;

export async function selectGoogleCredential(db: Db, userId: string): Promise<GoogleCredentialRow | undefined> {
  const [row] = await db.select().from(googleCredentials).where(eq(googleCredentials.userId, userId));
  return row;
}

export async function upsertGoogleCredential(db: Db, userId: string, values: { data: string; account: string | null }): Promise<void> {
  await db
    .insert(googleCredentials)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: googleCredentials.userId, set: { ...values, updatedAt: new Date() } });
}

export async function deleteGoogleCredential(db: Db, userId: string): Promise<void> {
  await db.delete(googleCredentials).where(eq(googleCredentials.userId, userId));
}
