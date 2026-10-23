/**
 * "Transaksi terakhir" di beranda = yang terakhir diinput (keputusan pengguna 2026-10-23): bon tanggal lama yang baru
 * dicatat hari ini tetap muncul paling atas. `createdAt` ISO UTC, jadi urut string = urut waktu.
 */
export function recentlyAdded<T extends { createdAt: string }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
