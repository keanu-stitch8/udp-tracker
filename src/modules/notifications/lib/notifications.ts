// Isi grup notifikasi (spec notifikasi). Murni: query menyiapkan data, lib membentuk item + angka.
import type { AttentionItem } from "@/modules/dashboard/lib/attention";
import { WIB } from "@/modules/shared/lib/date";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";
import { isMissingReceipt } from "@/modules/transactions/lib/receipt";
import type { TransactionView } from "@/modules/transactions/types/transaction";
import { inScope, type WalletScope } from "@/modules/wallets/lib/scope";
import { activityText, formatDayMonth, type ActivityRecord } from "./activity";

export interface NotificationItem {
  id: string;
  text: string;
  /** "dd/mm HH:mm" WIB; null untuk keadaan tanpa waktu (dompet minus, dll.). */
  when: string | null;
  href: string | null;
  unread: boolean;
}

export interface NotificationGroup {
  key: NotificationGroupKey;
  /** Tindak lanjut & akses: jumlah item terbuka. Aktivitas: jumlah unread. */
  count: number;
  items: NotificationItem[];
}

export const GROUP_LABEL: Record<NotificationGroupKey, string> = { followup: "Perlu ditindaklanjuti", activity: "Aktivitas", access: "Akun & akses" };
export const GROUP_SLUG: Record<NotificationGroupKey, string> = { followup: "tindak-lanjut", activity: "aktivitas", access: "akun" };

export function groupFromSlug(slug: string | null | undefined): NotificationGroupKey | null {
  return (Object.keys(GROUP_SLUG) as NotificationGroupKey[]).find((key) => GROUP_SLUG[key] === slug) ?? null;
}

/** Akun & akses hanya untuk Root (persetujuan akun). */
export function groupKeysFor(user: { isRoot: boolean }): NotificationGroupKey[] {
  return user.isRoot ? ["followup", "activity", "access"] : ["followup", "activity"];
}

export function totalCount(groups: { count: number }[]): number {
  return groups.reduce((total, group) => total + group.count, 0);
}

export function badgeLabel(count: number): string | null {
  return count <= 0 ? null : count > 99 ? "99+" : String(count);
}

const wibDayTime = new Intl.DateTimeFormat("en-GB", { timeZone: WIB, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Timestamp ISO → "dd/mm HH:mm" WIB. */
export function formatWhenWib(iso: string): string {
  const parts = Object.fromEntries(wibDayTime.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.day}/${parts.month} ${parts.hour}:${parts.minute}`;
}

type FollowupView = Pick<TransactionView, "id" | "type" | "date" | "time" | "amount" | "walletId" | "categoryId" | "categoryName" | "merchant" | "balanceCheckId" | "attachments">;

/** Transaksi tanpa bon (dalam cakupan, terbaru dulu), lalu item dompet beranda khusus Root/PM (`scope` null). */
export function followupItems(input: { views: FollowupView[]; adminCategoryId: string | null; scope: WalletScope; walletItems: AttentionItem[] }): NotificationItem[] {
  const receipts = input.views
    .filter((v) => isMissingReceipt(v, input.adminCategoryId) && inScope(input.scope, v.walletId))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .map((v) => ({
      id: `receipt-${v.id}`,
      text: `${v.categoryName ?? v.merchant ?? "Pengeluaran"} ${formatRupiah(v.amount)} belum ada bon`,
      when: `${formatDayMonth(v.date)} ${v.time}`,
      href: `/transaksi/${v.id}`,
      unread: false,
    }));
  const wallets = input.scope === null ? input.walletItems.map((item) => ({ id: `${item.kind}-${item.href}`, text: item.label, when: null, href: item.href, unread: false })) : [];
  return [...receipts, ...wallets];
}

export function accessItems(pending: { id: string; name: string | null; email: string; createdAt: string }[]): NotificationItem[] {
  return [...pending]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({
      id: `user-${u.id}`,
      text: `${u.name ? `${u.name} (${u.email})` : u.email} menunggu persetujuan`,
      when: formatWhenWib(u.createdAt),
      href: "/lainnya/pengguna",
      unread: false,
    }));
}

export interface ActivityEntry extends ActivityRecord {
  id: string;
  createdAt: string;
  transactionId: string | null;
  /** Keadaan transaksi sekarang (untuk link); null bila tidak ada. */
  transaction: { walletId: string; deleted: boolean } | null;
}

/** `entries` terbaru dulu. Unread = aktivitas orang lain setelah `seenAt` (null = belum pernah membuka); angka grup dihitung query (`countUnreadActivities`). */
export function activityItems(entries: ActivityEntry[], viewer: { viewerId: string; scope: WalletScope; seenAt: string | null }): NotificationItem[] {
  const seenMs = viewer.seenAt ? Date.parse(viewer.seenAt) : -Infinity;
  return entries.map((entry) => {
    const linkable = entry.transactionId && entry.transaction && !entry.transaction.deleted && inScope(viewer.scope, entry.transaction.walletId);
    return {
      id: entry.id,
      text: activityText(entry, viewer.viewerId),
      when: formatWhenWib(entry.createdAt),
      href: linkable ? `/transaksi/${entry.transactionId}` : null,
      unread: entry.actorId !== viewer.viewerId && Date.parse(entry.createdAt) > seenMs,
    };
  });
}
