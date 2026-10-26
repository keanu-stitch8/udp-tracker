import "server-only";
import type { Db } from "@/db/types";
import type { ActivityKind } from "@/modules/shared/types/enums";
import { insertActivities } from "../api/activities-repo";
import type { ActivitySnapshot } from "../lib/activity";

export interface TransactionActivity {
  kind: ActivityKind;
  transactionId: string;
  before: ActivitySnapshot | null;
  after: ActivitySnapshot | null;
}

/** Dipanggil command transaksi di dalam `db.transaction` yang sama: aktivitas ikut batal bila perubahan gagal. `actorId` null = sistem/tes. */
export async function recordActivities(db: Db, projectId: string, actorId: string | null, list: TransactionActivity[]): Promise<void> {
  await insertActivities(
    db,
    list.map((a) => ({ projectId, actorId, kind: a.kind, transactionId: a.transactionId, before: a.before, after: a.after })),
  );
}
