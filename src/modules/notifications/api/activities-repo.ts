import "server-only";
import { and, count, desc, eq, gt, isNull, ne, or } from "drizzle-orm";
import { activities, transactions, users } from "@/db/schema";
import type { Db } from "@/db/types";

export type NewActivityRow = typeof activities.$inferInsert;

export async function insertActivities(db: Db, values: NewActivityRow[]): Promise<void> {
  if (values.length) await db.insert(activities).values(values);
}

/** Aktivitas proyek terbaru dulu, dengan nama pelaku dan keadaan transaksi sekarang. `actorId` = hanya milik orang itu. */
export function selectActivities(db: Db, projectId: string, options: { actorId?: string; limit: number }) {
  return db
    .select({
      id: activities.id,
      kind: activities.kind,
      actorId: activities.actorId,
      actorName: users.name,
      actorEmail: users.email,
      transactionId: activities.transactionId,
      before: activities.before,
      after: activities.after,
      createdAt: activities.createdAt,
      walletId: transactions.walletId,
      deletedAt: transactions.deletedAt,
    })
    .from(activities)
    .leftJoin(users, eq(users.id, activities.actorId))
    .leftJoin(transactions, eq(transactions.id, activities.transactionId))
    .where(and(eq(activities.projectId, projectId), options.actorId ? eq(activities.actorId, options.actorId) : undefined))
    .orderBy(desc(activities.createdAt), desc(activities.id))
    .limit(options.limit);
}

/** Aktivitas orang lain (termasuk sistem) setelah `seenAt`; `seenAt` null = belum pernah membuka. */
export async function countUnreadActivities(db: Db, projectId: string, viewerId: string, seenAt: Date | null): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(activities)
    .where(and(eq(activities.projectId, projectId), or(isNull(activities.actorId), ne(activities.actorId, viewerId)), seenAt ? gt(activities.createdAt, seenAt) : undefined));
  return row?.value ?? 0;
}
