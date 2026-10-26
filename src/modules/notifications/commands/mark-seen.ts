import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { parseOrThrow } from "@/lib/validation";
import { NOTIFICATION_GROUPS } from "@/modules/shared/types/enums";
import { upsertSeenAt } from "../api/reads-repo";

const schema = z.object({ group: z.enum(NOTIFICATION_GROUPS, "Grup notifikasi tidak dikenal.") });

/** User membuka daftar satu grup → aktivitas sebelum saat ini tidak lagi dihitung unread (per orang, per proyek). */
export async function markSeen(db: Db, viewer: { userId: string; projectId: string }, input: unknown): Promise<void> {
  const { group } = parseOrThrow(schema, input);
  await upsertSeenAt(db, { ...viewer, group }, new Date());
}
