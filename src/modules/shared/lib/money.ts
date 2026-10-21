// Format & parse rupiah. Nominal selalu integer rupiah (spec §3).
const idNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp ${idNumber.format(Math.abs(amount))}`;
}

const oneDecimal = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",").replace(/,0$/, "");

/** Ringkas untuk ruang sempit (sel kalender): 850rb, 1,3jt, 1,5M. */
export function formatRupiahCompact(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}${oneDecimal(abs / 1_000_000_000)}M`;
  if (abs >= 1_000_000) return `${sign}${oneDecimal(abs / 1_000_000)}jt`;
  if (abs >= 1_000) return `${sign}${oneDecimal(abs / 1_000)}rb`;
  return `${sign}${abs}`;
}

/** "Rp 1.350.000" / "75.000,00" / "1,350,000" → integer rupiah; null jika tidak ada angka. */
export function parseRupiah(input: string): number | null {
  const withoutDecimals = input.trim().replace(/,\d{1,2}$/, "");
  const digits = withoutDecimals.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
