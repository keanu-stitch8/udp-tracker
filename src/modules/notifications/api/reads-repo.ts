import "server-only";
import { and, eq } from "drizzle-orm";
import { notificationReads } from "@/db/schema";
import type { Db } from "@/db/types";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";

interface ReadKey {
  userId: string;
  projectId: string;
  group: NotificationGroupKey;
}

export async function selectSeenAt(db: Db, key: ReadKey): Promise<Date | null> {
  const [row] = await db
    .select({ seenAt: notificationReads.seenAt })
    .from(notificationReads)
    .where(and(eq(notificationReads.userId, key.userId), eq(notificationReads.projectId, key.projectId), eq(notificationReads.group, key.group)));
  return row?.seenAt ?? null;
}

export async function upsertSeenAt(db: Db, key: ReadKey, seenAt: Date): Promise<void> {
  await db
    .insert(notificationReads)
    .values({ ...key, seenAt })
    .onConflictDoUpdate({ target: [notificationReads.userId, notificationReads.projectId, notificationReads.group], set: { seenAt } });
}
