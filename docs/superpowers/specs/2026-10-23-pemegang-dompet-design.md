# Pemegang dompet — desain

Tanggal: 2026-10-23. Melengkapi spec akses multi-divisi (§2 peran, §10 urutan rilis). Rilis 5; profil riwayat = Rilis 6; dua pagu mundur ke Rilis 7.

## Tujuan

Anggota hanya bisa mencatat dan mengubah transaksi di dompet yang dia pegang. Root dan PM bebas di semua dompet (hanya mereka yang bisa "overrule").

## Data

| Tabel | Kolom | Catatan |
|---|---|---|
| `wallet_holders` | `id`, `wallet_id` → `wallets` (cascade), `user_id` → `users` (cascade), `created_at` (ditugaskan), `assigned_by`, `revoked_at`, `revoked_by` (→ `users`, set null), `revoke_reason` (`revoked` \| `removed` \| `rejected`); unik (`wallet_id`, `user_id`) untuk baris aktif | Satu baris = satu periode pegangan. **Tidak pernah dihapus**, hanya dicabut (revisi pengguna 2026-10-23, migrasi 0012): pertanggungjawaban siapa memegang uang tetap tercatat. Satu dompet bisa dipegang beberapa orang. |

`wallets.holder` (teks bebas) tetap ada sebagai keterangan untuk pemegang tanpa akun (mis. sopir); tidak memberi hak apa pun.

## Aturan

Cakupan dompet (`walletScope`): Root/PM → `null` (semua); anggota → daftar dompet yang dia pegang (bisa kosong).

| Aksi anggota | Syarat |
|---|---|
| Lihat transaksi, dompet, beranda, kalender | Tetap semua (tidak berubah) |
| Buat pengeluaran / pemasukan | `walletId` dalam cakupan |
| Buat transfer | Dompet **asal** dalam cakupan; dompet tujuan bebas |
| Ubah transaksi | Dompet asal transaksi lama **dan** baru dalam cakupan |
| Hapus / pulihkan | Dompet asal transaksi dalam cakupan |
| Cek saldo, catat selisih | Dompet cek saldo dalam cakupan |

- Di luar cakupan → 403 `ForbiddenError` "Dompet ini bukan peganganmu. Minta PM mengubahnya."
- Anggota tanpa dompet = hanya lihat.
- Penegakan di server (command transaksi & cek saldo menerima cakupan dari route). UI hanya menyesuaikan tampilan.
- Pemegang dipilih dari anggota proyek (`project_members`). Hak mencatat hanya dari pegangan aktif (`revoked_at` kosong).
- Pegangan berakhir dengan info siapa dan kenapa: PM menekan Cabut (`revoked`), anggota dikeluarkan dari proyek (`removed`), akun ditolak (`rejected`). Ditugaskan lagi = baris baru.
- Hanya peran `manage` (Root/PM) yang mengatur pemegang.

## UI

- **Detail dompet**: kartu "Pemegang": pemegang aktif ("Sejak 23 Okt 2026, oleh Riski") + tombol Cabut (Root/PM), tombol "+ Pemegang" membuka `UserPicker` berisi anggota proyek; di bawahnya "Pernah memegang" ("20 Okt 2026 – 22 Okt 2026 · dikeluarkan dari proyek oleh Riski").
- **Daftar dompet**: nama pemegang di bawah nama dompet.
- **Anggota tanpa dompet pegangan**: tombol "+" di bottom nav disembunyikan; baris transaksi (daftar, beranda, kalender) tidak bisa diklik; halaman `/transaksi/baru` menampilkan alert "Kamu belum memegang dompet. Minta PM menugaskan dompet." tanpa form.
- **Anggota dengan dompet pegangan**: "+" tampil; baris transaksi di luar cakupan tidak bisa diklik; membuka URL edit transaksi di luar cakupan → alert, tanpa form.
- **Form transaksi (anggota)**: chip dompet asal hanya dompet pegangan; dompet tujuan transfer tetap semua. Default dompet terakhir hanya bila dalam cakupan.
- **Detail dompet (anggota)**: tombol cek saldo hanya untuk dompet pegangan.

## Lihat sebagai (pratinjau anggota)

Root/PM bisa melihat app persis seperti anggota tertentu, untuk mengecek hak dompetnya.

- Mulai: tombol **Lihat sebagai** di baris anggota halaman Anggota proyek (hanya peran `manage`, hanya untuk anggota proyek itu). `POST /api/projects/[projectId]/members/[userId]/view-as` (`manage`) menyetel cookie httpOnly `udp_view_as` = `{ projectId, userId }` dan mengaktifkan proyek itu.
- Selama aktif: halaman dan GET API memakai **pengguna efektif** = anggota itu (peran `member`, cakupan dompetnya, menu, daftar proyek). Sesi tetap milik Root/PM.
- **Semua request selain GET ditolak 403** "Mode lihat sebagai: data tidak bisa diubah." kecuali keluar dan logout. Ditegakkan di pembungkus `route`/`projectRoute`.
- Banner kuning di atas layar: "Melihat sebagai Arpan · Keluar". Keluar: `DELETE /api/view-as` → hapus cookie, kembali ke tampilan sendiri.
- Cookie diabaikan (dan dihapus) bila tidak valid lagi: pengguna asli bukan Root/PM proyek itu, atau target bukan anggota proyek itu lagi.

## API

- `PUT /api/projects/[projectId]/wallets/[walletId]/holders` (`manage`) body `{ userIds: string[] }` — ganti seluruh daftar; setiap id harus anggota proyek. Daftar & detail dompet menambah `holders: { id, name }[]`.
- Cakupan untuk tampilan: `ActiveProject.walletScope`, diteruskan ke klien lewat `WalletScopeProvider` di layout (baris transaksi, form, cek saldo); bottom nav lewat `BottomNavSection`.

## Pengujian

- Unit: matriks cakupan (Root, PM, anggota pemegang, anggota bukan pemegang, anggota tanpa dompet) untuk buat/transfer/ubah (pindah dompet keluar & masuk cakupan)/hapus/pulihkan/cek saldo.
- PUT holders: id bukan anggota → 400; anggota dikeluarkan → pegangannya hilang.
- Lihat sebagai: hanya `manage`; target harus anggota; GET memakai cakupan target; POST/PATCH/DELETE → 403; keluar berhasil; cookie basi diabaikan.
- E2E curl sekali: anggota pemegang Cash bisa input Cash, ditolak 403 di Rekening; Root "lihat sebagai" anggota → GET sesuai cakupan, POST 403.
