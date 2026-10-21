export interface BalanceCheck {
  id: string;
  walletId: string;
  date: string;
  actualBalance: number;
  /** Saldo aplikasi s/d tanggal cek, snapshot saat cek disimpan. */
  computedBalance: number;
  /** actualBalance − computedBalance: negatif = kurang, positif = lebih. */
  difference: number;
  note: string | null;
  /** Transaksi penyesuaian aktif untuk cek ini, jika selisih sudah dicatat. */
  adjustmentId: string | null;
  createdAt: string;
}
