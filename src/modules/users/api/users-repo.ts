import "server-only";
import { and, count, eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { Db } from "@/db/types";

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export async function selectUser(db: Db, id: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}

export async function selectUserByEmail(db: Db, email: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(users).where(eq(users.email, email));
  return row;
}

export function selectUsers(db: Db): Promise<UserRow[]> {
  return db.select().from(users);
}

export async function insertUser(db: Db, values: NewUserRow): Promise<UserRow> {
  const [row] = await db.insert(users).values(values).returning();
  return row;
}

export async function updateUserRow(db: Db, id: string, patch: Partial<NewUserRow>): Promise<UserRow> {
  const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  return row;
}

/** Jumlah Root aktif (Root terakhir dilindungi). */
export async function countActiveRoots(db: Db): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.isRoot, true), eq(users.status, "active")));
  return row?.n ?? 0;
}
