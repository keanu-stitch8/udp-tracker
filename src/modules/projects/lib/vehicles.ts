// Aturan mobil (murni): batas jumlah, nama dompet Flazz bawaan, nama unik, dan kapan mobil boleh dihapus.

export const MAX_VEHICLES = 5;

export function flazzWalletName(vehicleName: string): string {
  return `Flazz ${vehicleName}`;
}

/** `base`, atau `base (2)`, `base (3)`, … bila nama sudah dipakai (tanpa beda huruf besar/kecil). */
export function uniqueName(base: string, taken: string[]): string {
  const used = new Set(taken.map((n) => n.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  for (let i = 2; ; i++) {
    const name = `${base} (${i})`;
    if (!used.has(name.toLowerCase())) return name;
  }
}

interface RemovalRefs {
  wallets: { id: string; vehicleId: string | null; openingBalance: number }[];
  /** Semua transaksi proyek termasuk yang dihapus (FK transaksi → dompet RESTRICT). */
  transactions: { vehicleId: string | null; walletId: string; toWalletId: string | null; deletedAt: Date | null }[];
}

/** Mobil boleh dihapus jika tidak dipakai transaksi aktif dan dompet Flazz-nya kosong; dompet itu ikut dihapus. */
export function vehicleRemoval(vehicleId: string, refs: RemovalRefs): { allowed: boolean; walletIds: string[] } {
  const walletIds = refs.wallets.filter((w) => w.vehicleId === vehicleId).map((w) => w.id);
  const ids = new Set(walletIds);
  const usedByTransaction = refs.transactions.some((t) => !t.deletedAt && t.vehicleId === vehicleId);
  const walletUsed =
    refs.wallets.some((w) => ids.has(w.id) && w.openingBalance !== 0) ||
    refs.transactions.some((t) => ids.has(t.walletId) || (t.toWalletId !== null && ids.has(t.toWalletId)));
  return { allowed: !usedByTransaction && !walletUsed, walletIds };
}
