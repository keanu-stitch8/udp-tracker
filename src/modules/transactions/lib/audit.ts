import type { TransactionView } from "../types/transaction";

/** "Diinput oleh X · Diubah oleh Y" (spec akses §7). Bagian "Diubah" hanya bila transaksi pernah diubah; data lama → "—". */
export function auditLine(t: Pick<TransactionView, "createdByName" | "updatedByName" | "createdAt" | "updatedAt">): string {
  const created = `Diinput oleh ${t.createdByName ?? "—"}`;
  if (t.updatedAt === t.createdAt) return created;
  return `${created} · Diubah oleh ${t.updatedByName ?? "—"}`;
}
