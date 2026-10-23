# Akses multi-divisi — desain

Tanggal: 2026-10-23. Mengubah spec utama §7 (login satu password) dan melengkapi spec pagu, beranda, dan ekspor.

## Tujuan

App dipakai banyak orang lintas divisi. Setiap orang login dengan Google dan hanya melihat proyek yang menjadi haknya. Pagu punya dua tarif: tarif management (asli, termasuk cadangan) dan tarif karyawan (yang diketahui tim lapangan). Setiap transaksi tercatat siapa yang menginput dan mengubah.

Contoh struktur: divisi **MKK** berisi proyek "Q4 Hero & Editorial Feature Videos - Part 1" dan "Part 2"; divisi **MLSC** berisi "MLSC Bekasi 2026". Nama divisi diatur di UI, tidak ada di kode.

## 1. Model data

**Tabel baru**

| Tabel | Kolom | Aturan |
|---|---|---|
| `divisions` | `id`, `name`, timestamps | Nama unik tanpa beda huruf besar/kecil (dicek di service). Hanya Root yang mengelola. |
| `users` | `id`, `email` (unik, huruf kecil), `name`, `image_url`, `status` (`pending` / `active` / `rejected`), `is_root`, `last_login_at`, timestamps | Dibuat saat login Google pertama. |
| `division_pms` | `division_id`, `user_id` (PK gabungan, cascade) | Satu orang bisa PM di beberapa divisi. Diatur Root. |
| `project_members` | `project_id`, `user_id` (PK gabungan, cascade), `added_by`, `created_at` | Anggota per proyek, dipilih satu per satu (personel tiap proyek berbeda). |
| `project_invitations` | `project_id`, `email`, `invited_by`, `created_at` (PK `project_id`+`email`, cascade) | Undangan PM untuk email yang belum pernah login. |

**Tabel yang berubah**

- `projects.division_id` wajib, FK `restrict`. Migrasi membuat divisi **"Umum"** dan memasukkan semua proyek yang ada ke sana; pengguna mengganti namanya di UI.
- `google_credentials` menjadi per user (`user_id` unik, cascade). Token lama dihapus saat migrasi; Root/PM menghubungkan ulang.
- `transactions.created_by`, `transactions.updated_by`: FK `users` nullable, `on delete set null`. Data lama kosong, tampil "—".
- `budgets.employee_rate` integer nullable, `>= 0`. Kosong = sama dengan `rate`.
- `login_attempts` dan env `APP_PASSWORD_HASH` dibuang.

## 2. Peran dan kemampuan

Peran efektif per proyek dihitung di satu fungsi, `projectRole(db, user, projectId)`:

| Hasil | Syarat (dicek berurutan) |
|---|---|
| `root` | `users.is_root` |
| `pm` | user ada di `division_pms` untuk divisi proyek itu |
| `member` | user ada di `project_members` proyek itu |
| `null` | selain itu, atau user tidak `active` |

`null` diperlakukan sebagai proyek tidak ada (404), supaya keberadaan proyek lain tidak bocor.

| Kemampuan | root | pm | member |
|---|---|---|---|
| `view`: beranda, kalender, daftar dan detail transaksi | ✓ | ✓ | ✓ |
| `transact`: tambah/ubah/hapus semua transaksi proyek, scan bon, cek saldo | ✓ | ✓ | ✓ |
| `budgetSecret`: tarif management, cadangan | ✓ | ✓ | – |
| `manage`: pengaturan (dompet, kategori, grup, pagu, mobil, proyek), anggota dan undangan, ekspor, hapus proyek | ✓ | ✓ | – |

Di luar proyek:

- **Buat proyek:** Root di divisi mana pun; PM hanya di divisinya.
- **Kelola divisi, PM, dan akun menunggu/ditolak:** Root saja.
- **Root terakhir** tidak bisa dicabut atau diturunkan.

## 3. Login dan sesi

- `/login` memakai gaya sign-in card NeoBrutalism (`neobrutalism.com/blocks/authentication/sign-in-card-with-social-buttons`) dengan satu tombol **"Masuk dengan Google"**.
- OAuth client UDP Tracker yang sama dengan ekspor. Scope login: `openid email profile`. Route: `/api/auth/google/login/start` dan `/api/auth/google/login/callback` (state cookie anti-CSRF seperti ekspor).
- Email hanya diterima bila `email_verified`. Email disimpan huruf kecil.
- Saat login:
  1. Cari/buat `users` berdasarkan email; perbarui nama, foto, `last_login_at`.
  2. Email ada di env `ROOT_EMAILS` (dipisah koma) → `active` + `is_root`. Ini juga jalur pemulihan bila Root terkunci.
  3. Ada `project_invitations` untuk email itu → ubah semua jadi `project_members`, hapus undangannya, user jadi `active` (kecuali `rejected`: undangan tetap dihapus, status tidak berubah).
  4. Selain itu user baru berstatus `pending`.
- Cookie sesi berisi `userId` yang ditandatangani `SESSION_SECRET`. Status dan peran dibaca dari DB setiap request, jadi pencabutan akses berlaku seketika.
- Layar selain aktif (di dalam layout app, menggantikan isi halaman):
  - `pending`: "Menunggu konfirmasi admin", email yang dipakai, tombol Keluar.
  - `rejected`: "Akses ditolak", tombol Keluar.
  - `active` tanpa proyek: empty state "Belum ada proyek. Minta PM menambahkan kamu."
- Header/Lainnya menampilkan foto dan nama pengguna, dan tombol Keluar.

## 4. Halaman baru

**Pengguna** (`/lainnya/pengguna`, Root)

- Tab Menunggu / Aktif / Ditolak dengan jumlah.
- *Setujui* membuka drawer pemilihan peran: Anggota, PM (pilih satu atau lebih divisi), atau Root.
- *Ubah peran* untuk akun aktif, dengan drawer yang sama.
- *Tolak* dan *Cabut akses* dengan konfirmasi. Cabut = status `rejected`, keanggotaan proyek dan peran PM dihapus. Akun ditolak bisa disetujui lagi.

**Divisi** (`/lainnya/divisi`, Root)

- Tambah, ganti nama, atur PM per divisi.
- Hapus hanya bila divisi tanpa proyek, dengan konfirmasi.

**Anggota proyek** (`/lainnya/anggota`, kemampuan `manage`)

- Daftar anggota dan undangan menunggu.
- *Tambah lewat email*:

  | Status email | Hasil |
  |---|---|
  | `active` | Jadi anggota |
  | `pending` | Diaktifkan dan jadi anggota |
  | belum ada | Disimpan sebagai undangan |
  | `rejected` | Ditolak: "Akun ini ditolak admin." |

- PM hanya bisa memberi peran anggota. Hapus anggota dan batalkan undangan dengan konfirmasi.

**Pemilih proyek dan proyek baru**

- Pemilih proyek dikelompokkan per divisi dan hanya berisi proyek yang boleh diakses.
- Cookie proyek aktif divalidasi setiap request; bila tidak boleh lagi, pindah ke proyek lain yang boleh.
- Form proyek baru punya pilihan divisi (Root: semua; PM: divisinya, terisi otomatis bila hanya satu).
- **Hapus proyek:** hanya Root dan PM divisinya. Konfirmasi dengan mengetik ulang nama proyek (menggantikan konfirmasi password).

## 5. Penegakan akses

1. **`proxy.ts`** hanya memeriksa tanda tangan cookie (tanpa DB).
2. **`route(handler)`** memuat user dari DB dan menolak user yang tidak `active`. Untuk route non-proyek. Varian `rootRoute` untuk Pengguna dan Divisi.
3. **`projectRoute(kemampuan, handler)`** untuk **semua** route di `src/app/api/projects/[projectId]/`: hitung `projectRole`; `null` → 404; kurang kemampuan → 403; lolos → handler menerima `{ user, role }`.
4. **ID anak milik proyek di URL.** Setiap service yang menerima `transactionId`, `walletId`, `budgetId`, `categoryId`, `groupId`, `vehicleId`, `checkId`, `attachmentId` memfilter `project_id`. Semua service diaudit.
5. **Halaman server.** `getActiveProject` hanya memilih dari proyek yang boleh. `/transaksi/[id]` memeriksa proyek transaksi itu. Halaman pengaturan memanggil `notFound()` tanpa `manage`, dan menunya disembunyikan. Pengguna/Divisi khusus Root.
6. **Redaksi di server.** Untuk peran tanpa `budgetSecret`, tarif management dan cadangan tidak pernah ada di respons (mapper pagu, kalender, ringkasan).
7. `/api/projects` GET hanya mengembalikan proyek yang boleh; POST mengikuti aturan buat proyek.

## 6. Ekspor

- Hanya kemampuan `manage`.
- Koneksi Google per user: menghubungkan meminta scope `drive.file` (terpisah dari login, jadi anggota tidak pernah dimintai izin Drive). File masuk ke Drive orang yang mengekspor.
- Tab Pagu dan Detail ekspor berisi tarif management dan karyawan, karena pengekspor selalu punya `budgetSecret`.

## 7. Jejak penginput

- Buat transaksi mengisi `created_by` dan `updated_by`; ubah, hapus (soft delete), dan pulihkan mengisi `updated_by`.
- Detail transaksi menampilkan "Diinput oleh X · Diubah oleh Y" (nama, fallback email).
- Ekspor tab Detail menambah kolom **Diinput oleh** dan **Diubah oleh**.

## 8. Dua pagu

- Form pagu: *Tarif management* (wajib, kolom `rate` yang sudah ada) dan *Tarif karyawan* (opsional). Hanya terlihat oleh peran dengan `budgetSecret`; anggota tidak membuka pengaturan pagu.
- Perhitungan pagu memakai tarif efektif per peran:
  - Anggota: `employee_rate`. Pagu tanpa tarif karyawan **tidak dikirim** ke anggota (revisi pengguna Rilis 7: fallback ke `rate` membocorkan angka management). "Lebih pagu" dihitung dari angka ini.
  - Root/PM: pagu karyawan = `employee_rate ?? rate`.
  - Root/PM: keduanya. Ditampilkan pagu karyawan, pagu management, dan **cadangan** = total management − total karyawan, serta apakah kelebihan atas pagu karyawan masih tertutup cadangan.
- Kalender dan halaman Pagu mengikuti aturan yang sama. Beranda tetap tanpa pagu.

## 9. Lingkungan

- Branch Neon **`dev`** (salinan dari `production`) untuk `npm run dev` dan migrasi lokal. `.env.local` mengarah ke `dev`. Production hanya bermigrasi saat deploy (`vercel-build`).
- Env baru: `ROOT_EMAILS`. Env dibuang: `APP_PASSWORD_HASH`.
- OAuth client: tambah redirect `…/api/auth/google/login/callback` untuk production dan `http://localhost:3051`. Consent screen sudah In production.

## 10. Urutan rilis

| Rilis | Isi | Migrasi |
|---|---|---|
| 1 | Perbaikan beranda (lihat bawah) | – |
| 2 | Divisi | `divisions`, `projects.division_id` (proyek lama → "Umum") |
| 3 | Login Google, akun, peran, penegakan akses, ekspor per user (§3–§6) | `users`, `division_pms`, `project_members`, `project_invitations`; `google_credentials.user_id`; buang `login_attempts` |
| 4 | Jejak penginput (§7) | `transactions.created_by`, `updated_by` |
| 5 | Dua pagu (§8) | `budgets.employee_rate` |

Rilis 3 tidak boleh dipecah: login tanpa penegakan akses membuat setiap akun yang disetujui bisa melihat semua proyek.

Sebelum push Rilis 3: set `ROOT_EMAILS` di Vercel, tambah redirect URI login. Setelah deploy: login Google, hubungkan ulang Google di Ekspor.

Setiap rilis punya rencana sendiri, ditulis tepat sebelum dikerjakan.

### Rilis 1: perbaikan beranda

- `StatTile`: padding kanan untuk kotak ikon hanya pada label; nominal selebar kartu, `whitespace-nowrap`, ukuran font turun sedikit untuk angka panjang.
- "Perlu ditindaklanjuti" memakai komponen `Item` NeoBrutalism (`item` ditambah ke `ui.config.json`, lalu `npm run ui:sync`): `Item variant="outline"` sebagai link, ikon per jenis, judul, chevron.
- "Pengeluaran per grup" urut nama grup A–Z dengan aturan yang sama seperti picker kategori ("Lain-lain"/"Lainnya" di akhir); "Tanpa kategori" paling bawah. Kategori di dalam grup tetap terbesar dulu.

## Pengujian

- Unit (PGlite): matriks `projectRole` (root, PM divisi sendiri, PM divisi lain, anggota, bukan anggota, pending, rejected) dan tabel kemampuan.
- Tes penjaga statis: setiap `route.ts` di bawah `api/projects/[projectId]` memakai `projectRoute`.
- Tes ID anak: setiap service menolak ID milik proyek lain.
- Tes redaksi: respons pagu, kalender, dan ringkasan untuk anggota tanpa tarif management.
- Tes alur login: root dari env, undangan jadi anggota, pending, rejected tetap rejected.
- E2E curl sekali per rilis (`next start -p 3100`): sesi Root, PM, anggota, dan orang luar terhadap route kunci.
