import "server-only";
import type { Db } from "@/db/types";
import { attentionItems, latestChecks } from "@/modules/dashboard/lib/attention";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";
import { toTransactionViews } from "@/modules/transactions/lib/ledger";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import type { Role } from "@/modules/users/lib/access";
import { selectUsers } from "@/modules/users/api/users-repo";
import type { CurrentUser } from "@/modules/users/types/user";
import { selectProjectBalanceChecks } from "@/modules/wallets/api/balance-checks-repo";
import { walletBalances } from "@/modules/wallets/lib/balances";
import type { WalletScope } from "@/modules/wallets/lib/scope";
import { countUnreadActivities, selectActivities } from "../api/activities-repo";
import { selectSeenAt } from "../api/reads-repo";
import type { ActivitySnapshot } from "../lib/activity";
import { accessItems, activityItems, followupItems, groupKeysFor, type NotificationGroup } from "../lib/notifications";

export interface NotificationViewer {
  projectId: string;
  user: CurrentUser;
  role: Role;
  scope: WalletScope;
}

export interface Notifications {
  groups: NotificationGroup[];
}

async function followupGroup(db: Db, viewer: NotificationViewer, limit: number): Promise<NotificationGroup> {
  const [ledger, checkRows] = await Promise.all([getLedger(db, viewer.projectId), selectProjectBalanceChecks(db, viewer.projectId)]);
  const balances = walletBalances(ledger.wallets, ledger.transactions);
  const wallets = ledger.wallets.filter((w) => !w.archived).map((w) => ({ ...w, balance: balances.get(w.id) ?? w.openingBalance }));
  const items = followupItems({
    views: toTransactionViews(ledger.transactions, refsOf(ledger)),
    adminCategoryId: ledger.categories.find((c) => c.isAdminFee)?.id ?? null,
    scope: viewer.scope,
    walletItems: attentionItems({ missingReceipts: 0, wallets, latestChecks: latestChecks(checkRows, ledger.transactions) }),
  });
  return { key: "followup", count: items.length, items: items.slice(0, limit) };
}

/** Anggota hanya melihat aktivitasnya sendiri (tanpa angka); Root/PM semua aktivitas proyek. */
async function activityGroup(db: Db, viewer: NotificationViewer, limit: number): Promise<NotificationGroup> {
  const own = viewer.role === "member";
  const key = { userId: viewer.user.id, projectId: viewer.projectId, group: "activity" as const };
  const [seenAt, rows] = await Promise.all([selectSeenAt(db, key), selectActivities(db, viewer.projectId, { actorId: own ? viewer.user.id : undefined, limit })]);
  const items = activityItems(
    rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      actorId: row.actorId,
      actorName: row.actorName ?? row.actorEmail,
      before: row.before as ActivitySnapshot | null,
      after: row.after as ActivitySnapshot | null,
      createdAt: row.createdAt.toISOString(),
      transactionId: row.transactionId,
      transaction: row.walletId ? { walletId: row.walletId, deleted: row.deletedAt !== null } : null,
    })),
    { viewerId: viewer.user.id, scope: viewer.scope, seenAt: seenAt?.toISOString() ?? null },
  );
  const count = own ? 0 : await countUnreadActivities(db, viewer.projectId, viewer.user.id, seenAt);
  return { key: "activity", count, items };
}

async function accessGroup(db: Db, _viewer: NotificationViewer, limit: number): Promise<NotificationGroup> {
  const pending = (await selectUsers(db)).filter((u) => u.status === "pending");
  const items = accessItems(pending.map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt.toISOString() })));
  return { key: "access", count: items.length, items: items.slice(0, limit) };
}

const LOADERS: Record<NotificationGroupKey, (db: Db, viewer: NotificationViewer, limit: number) => Promise<NotificationGroup>> = {
  followup: followupGroup,
  activity: activityGroup,
  access: accessGroup,
};

/** `group` = satu grup saja (halaman dengan filter); grup di luar hak peran tidak pernah dimuat. */
export async function getNotifications(db: Db, viewer: NotificationViewer, options: { group?: NotificationGroupKey | null; limit: number }): Promise<Notifications> {
  const keys = groupKeysFor(viewer.user).filter((key) => !options.group || key === options.group);
  return { groups: await Promise.all(keys.map((key) => LOADERS[key](db, viewer, options.limit))) };
}
