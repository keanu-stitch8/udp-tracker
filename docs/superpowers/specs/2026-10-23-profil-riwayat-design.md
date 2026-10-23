# Profil riwayat — desain

Tanggal: 2026-10-23. Rilis 6 (setelah pemegang dompet). Keputusan pengguna: riwayat tetap tampil setelah dikeluarkan dari proyek; Root/PM bisa membuka riwayat orang lain; proyek masuk riwayat bila ada jejak.

## Tujuan

Setiap orang bisa melihat riwayat kerjanya per proyek: dompet yang dia pegang, selisih cek saldo, dan transaksi yang dia input. Root/PM memakai halaman yang sama untuk pertanggungjawaban per orang.

## Isi riwayat

Proyek masuk riwayat seseorang bila dia **menginput transaksi aktif** (`created_by`) di proyek itu **atau pernah memegang dompet** di proyek itu (pegangan aktif maupun dicabut). Urut proyek terbaru dulu.

Per proyek:

| Bagian | Isi |
|---|---|
| Kepala | Nama, tanggal, status (berjalan/selesai), divisi |
| Dompet pegangan | Per dompet yang **pernah** dia pegang: periode + status ("masih memegang" / "dicabut … oleh …"), saldo awal, masuk, keluar, saldo akhir dompet itu (plus = dikembalikan ke kantor, minus = perlu reimburse; dompet Reimburse memakai label statusnya). Selisih cek saldo terakhir bila ada. |
| Yang dia input | Jumlah transaksi, total masuk, total keluar (pengeluaran + biaya admin), per kategori di halaman detail |

Dikeluarkan dari proyek → pegangannya dicabut tapi riwayatnya tetap (migrasi 0012), jadi proyek lama tetap menampilkan dompet yang pernah dia pegang. Pagu tidak pernah tampil.

## Halaman

- `Lainnya` → kartu nama user jadi link ke **Profil** (`/lainnya/profil`): riwayat sendiri.
- `/lainnya/profil/[userId]`: riwayat orang itu. Kartu per proyek → `/lainnya/profil/[userId]/[projectId]`: rincian per kategori + daftar transaksi yang dia input (hanya baca, tanpa link edit).
- Tombol **Riwayat** di baris Anggota proyek (PM/Root) dan di halaman Pengguna (Root).

## Hak lihat

| Penonton | Proyek yang terlihat di riwayat orang lain |
|---|---|
| Diri sendiri | Semua proyek di riwayatnya, termasuk yang sudah tidak bisa dia akses (hanya ringkasan & transaksinya sendiri) |
| Root | Semua |
| PM | Proyek di divisi yang dia pegang |
| Lainnya | Tidak boleh → 404 |

Riwayat orang lain yang hasil saringnya kosong tetap tampil kosong bagi Root/PM ("Belum ada riwayat di divisimu"); user yang tidak ada → 404.

## Teknis

- Server-rendered (hanya baca): query `getPersonHistory(db, viewer, subjectId)` dan `getPersonProjectHistory(db, viewer, subjectId, projectId)` di modul baru `src/modules/profile`; perhitungan murni di `lib/history.ts` (memakai `walletBalances`, `expenseEntries`).
- Penjaga: `viewer.id === subjectId` atau Root, atau PM untuk proyek di divisinya. Lihat sebagai: penonton = pengguna efektif (anggota itu).

## Pengujian

- Unit `lib/history.ts`: ringkasan dompet & input, proyek tanpa jejak tidak masuk.
- PGlite: diri sendiri tetap melihat proyek setelah dikeluarkan; PM hanya divisinya; anggota lain 404.
- E2E curl: halaman profil sendiri, PM buka riwayat anggota, anggota buka riwayat orang lain → 404.
