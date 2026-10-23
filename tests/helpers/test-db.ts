import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import type { Db } from "@/db/types";
import type { UserStatus } from "@/modules/shared/types/enums";
import { toCurrentUser } from "@/modules/users/mappers/user";
import type { Actor, CurrentUser } from "@/modules/users/types/user";

/** Postgres in-memory dengan migrasi yang sama seperti produksi. Satu instance per test. */
export async function createTestDb(): Promise<Db> {
  const db = drizzle({ client: new PGlite(), schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  return db;
}

/** Id divisi bawaan ("Umum", dibuat migrasi 0007) untuk tes yang membuat proyek. */
export async function testDivisionId(db: Db): Promise<string> {
  const [division] = await db.select({ id: schema.divisions.id }).from(schema.divisions).limit(1);
  return division.id;
}

/** Root tanpa baris DB: cukup untuk command yang hanya memeriksa izin (mis. buat proyek di tes lama). */
export const testRoot: Actor = { id: "00000000-0000-4000-8000-0000000000ff", isRoot: true };

/** User di DB (default aktif, bukan Root). */
export async function createTestUser(db: Db, values: { email: string; status?: UserStatus; isRoot?: boolean; name?: string }): Promise<CurrentUser> {
  const [row] = await db
    .insert(schema.users)
    .values({ status: "active", ...values })
    .returning();
  return toCurrentUser(row);
}
