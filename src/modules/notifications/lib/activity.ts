// Teks log aktivitas (spec notifikasi). Murni: snapshot disimpan saat kejadian, teks dibentuk saat ditampilkan.
import type { ActivityKind, TransactionType } from "@/modules/shared/types/enums";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { Transaction } from "@/modules/transactions/types/transaction";

/** Keadaan transaksi saat aktivitas terjadi; nama disalin agar ganti nama kategori/dompet tidak mengubah riwayat. */
export interface ActivitySnapshot {
  type: TransactionType;
  label: string;
  amount: number;
  date: string;
  time: string;
  walletName: string;
  /** Jumlah bon terlampir. */
  receipts: number;
}

export interface ActivityRecord {
  kind: ActivityKind;
  actorId: string | null;
  actorName: string | null;
  before: ActivitySnapshot | null;
  after: ActivitySnapshot | null;
}

interface Named {
  id: string;
  name: string;
}

type SnapshotSource = Pick<Transaction, "type" | "amount" | "date" | "time" | "categoryId" | "walletId" | "toWalletId" | "merchant">;

export function snapshotOf(transaction: SnapshotSource, refs: { wallets: Named[]; categories: Named[] }, receipts: number): ActivitySnapshot {
  const walletName = (id: string | null) => refs.wallets.find((w) => w.id === id)?.name ?? "—";
  const label =
    transaction.type === "transfer"
      ? `${walletName(transaction.walletId)} → ${walletName(transaction.toWalletId)}`
      : (refs.categories.find((c) => c.id === transaction.categoryId)?.name ?? transaction.merchant ?? "Transaksi");
  return { type: transaction.type, label, amount: transaction.amount, date: transaction.date, time: transaction.time, walletName: walletName(transaction.walletId), receipts };
}

/** "2026-10-22" → "22/10" */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function activityChanges(before: ActivitySnapshot, after: ActivitySnapshot): string[] {
  const changes: string[] = [];
  if (before.label !== after.label) changes.push(`kategori ${before.label} → ${after.label}`);
  if (before.amount !== after.amount) changes.push(`nominal ${formatRupiah(before.amount)} → ${formatRupiah(after.amount)}`);
  if (before.date !== after.date) changes.push(`tanggal ${formatDayMonth(before.date)} → ${formatDayMonth(after.date)}`);
  if (before.time !== after.time) changes.push(`jam ${before.time} → ${after.time}`);
  if (before.walletName !== after.walletName) changes.push(`dompet ${before.walletName} → ${after.walletName}`);
  if (after.receipts > before.receipts) changes.push("bon ditambahkan");
  else if (after.receipts < before.receipts) changes.push("bon dihapus");
  return changes;
}

const VERB: Record<ActivityKind, string> = {
  transaction_created: "menambahkan",
  transaction_updated: "mengubah",
  transaction_deleted: "menghapus",
  transaction_restored: "memulihkan",
};

export function activityText(record: ActivityRecord, viewerId: string): string {
  const actor = record.actorId === null ? "Sistem" : record.actorId === viewerId ? "Anda" : (record.actorName ?? "Seseorang");
  const snap = (record.after ?? record.before)!;
  const brief = `${snap.label} ${formatRupiah(snap.amount)}`;
  const at = `(${formatDayMonth(snap.date)} ${snap.time})`;
  const verb = VERB[record.kind];
  if (record.kind === "transaction_created") return `${actor} ${verb} ${brief} untuk ${formatDayMonth(snap.date)} jam ${snap.time}`;
  if (record.kind === "transaction_updated" && record.before && record.after) {
    const changes = activityChanges(record.before, record.after);
    if (changes.length) return `${actor} ${verb} ${record.before.label}: ${changes.join(", ")}`;
  }
  return `${actor} ${verb} ${brief} ${at}`;
}
