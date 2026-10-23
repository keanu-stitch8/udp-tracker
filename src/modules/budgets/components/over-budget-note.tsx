import { formatRupiah } from "@/modules/shared/lib/money";

/**
 * Keterangan lebih pagu. `limit` = pagu karyawan; `managementLimit` hanya dikirim ke Root/PM —
 * bila beda, kelebihan atas pagu karyawan disebut tertutup cadangan selama belum melewati pagu management.
 */
export function OverBudgetNote({ used, limit, managementLimit }: { used: number; limit: number; managementLimit?: number }) {
  const over = used - limit;
  if (over <= 0) return null;
  if (managementLimit === undefined || managementLimit === limit) return <p className="text-destructive">Lebih pagu {formatRupiah(over)}</p>;
  if (used <= managementLimit) return <p>Lebih pagu karyawan {formatRupiah(over)} · tertutup cadangan</p>;
  return (
    <p className="text-destructive">
      Lebih pagu karyawan {formatRupiah(over)} · lebih pagu management {formatRupiah(used - managementLimit)}
    </p>
  );
}
