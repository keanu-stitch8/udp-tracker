// Teks riwayat pegangan dompet (spec pemegang dompet). Murni: tanggal dalam WIB.
import { formatDateLong, todayWib } from "@/modules/shared/lib/date";
import type { HolderRevokeReason } from "@/modules/shared/types/enums";
import type { WalletHolderRecord } from "../types/wallet-holder";

export const REVOKE_REASON_LABELS: Record<HolderRevokeReason, string> = {
  revoked: "dicabut",
  removed: "dikeluarkan dari proyek",
  rejected: "akun ditolak",
};

const dateOf = (timestamp: string) => formatDateLong(todayWib(new Date(timestamp)));

/** Pegangan aktif: "Sejak 23 Okt 2026, oleh Riski". */
export function describeActiveHolder(record: WalletHolderRecord): string {
  return `Sejak ${dateOf(record.assignedAt)}${record.assignedByName ? `, oleh ${record.assignedByName}` : ""}`;
}

/** Pegangan berakhir: "20 Okt 2026 – 22 Okt 2026 · dikeluarkan dari proyek oleh Riski". */
export function describeRevokedHolder(record: WalletHolderRecord): string {
  const reason = record.revokeReason ? REVOKE_REASON_LABELS[record.revokeReason] : "dicabut";
  return `${dateOf(record.assignedAt)} – ${dateOf(record.revokedAt!)} · ${reason}${record.revokedByName ? ` oleh ${record.revokedByName}` : ""}`;
}
