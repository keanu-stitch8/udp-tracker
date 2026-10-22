import { formatRupiah } from "@/modules/shared/lib/money";

/** Dompet Reimburse = uang talangan orang: saldo minus berarti belum diganti UDP. */
export function reimburseStatus(balance: number): string {
  if (balance < 0) return `Belum diganti ${formatRupiah(-balance)}`;
  if (balance > 0) return `Lebih diganti ${formatRupiah(balance)}`;
  return "Lunas";
}
