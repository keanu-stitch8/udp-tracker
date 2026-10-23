// Cakupan dompet (spec pemegang dompet). Murni: dipakai server (penegakan) dan klien (tampilan).

/** `null` = semua dompet (Root/PM); daftar = dompet yang dipegang anggota (bisa kosong = hanya lihat). */
export type WalletScope = string[] | null;

export function inScope(scope: WalletScope, walletId: string): boolean {
  return scope === null || scope.includes(walletId);
}

/** Boleh mencatat transaksi baru sama sekali. */
export function canTransact(scope: WalletScope): boolean {
  return scope === null || scope.length > 0;
}

/** Transaksi bisa dibuka/diubah bila dompet asalnya dalam cakupan. */
export function canEditTransaction(scope: WalletScope, transaction: { walletId: string }): boolean {
  return inScope(scope, transaction.walletId);
}

export const OUT_OF_SCOPE_MESSAGE = "Dompet ini bukan peganganmu. Minta PM mengubahnya.";
export const NO_WALLET_MESSAGE = "Kamu belum memegang dompet. Minta PM menugaskan dompet.";
