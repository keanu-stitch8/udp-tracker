import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { loginAttempts } from "@/db/schema";
import type { Db } from "@/db/types";

export async function insertLoginAttempt(db: Db, values: { ip: string; success: boolean; attemptedAt: Date }): Promise<void> {
  await db.insert(loginAttempts).values(values);
}

export async function countFailedAttemptsSince(db: Db, ip: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false), gte(loginAttempts.attemptedAt, since)));
  return row?.total ?? 0;
}
