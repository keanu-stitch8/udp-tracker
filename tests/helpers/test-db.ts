import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import type { Db } from "@/db/types";

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
