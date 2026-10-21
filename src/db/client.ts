import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import { withVerifiedSsl } from "./connection-string";
import * as schema from "./schema";
import type { Db } from "./types";

let instance: Db | undefined;

/**
 * Pool `pg` ke URL pooled Neon (-pooler), dipakai ulang antar request — rekomendasi skill Neon untuk Vercel Fluid compute.
 * attachDatabasePool menjaga instance hidup sampai koneksi idle ditutup; di luar Vercel (localhost) no-op.
 */
export function getDb(): Db {
  if (!instance) {
    const pool = new Pool({ connectionString: withVerifiedSsl(env().DATABASE_URL) });
    attachDatabasePool(pool);
    instance = drizzle({ client: pool, schema, casing: "snake_case" });
  }
  return instance;
}
