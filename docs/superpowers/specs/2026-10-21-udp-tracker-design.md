# UDP Tracker — Design Spec

- **Tanggal:** 2026-10-21
- **Status:** Disetujui (brainstorming), menunggu review spec
- **Pemilik:** Riski

## 1. Tujuan

Aplikasi web mobile-first untuk mencatat dan mempertanggungjawabkan **UDP** (uang operasional) yang ditransfer kantor ke tim produksi di lapangan. Satu pengguna (pemegang UDP) mencatat semua pemasukan, pengeluaran, dan perpindahan uang antar "dompet", lalu mengekspor laporan akhir ke **Google Sheets** lengkap dengan link foto bon/kwitansi di Google Drive.

Contoh konteks produksi: 9 orang, 2 mobil, 1 kartu Flazz per mobil, kantor transfer UDP ±4 kali selama produksi.

**Prinsip: aplikasi generik (reusable).** Tidak ada logika, tarif, atau data khusus satu klien/kontrak di kode (keputusan pengguna 2026-10-21). Semua angka (pagu, tarif, jumlah hari) diatur per proyek lewat UI. Seed proyek baru hanya berisi dompet dan kategori umum.

### Kriteria sukses

1. Mencatat satu pengeluaran dari HP (foto bon → simpan) dalam < 20 detik.
2. Scan bon mengisi **tanggal** dan **nominal** otomatis; pengguna hanya mengoreksi bila perlu.
3. Saldo setiap dompet (rekening, cash, Flazz per mobil) selalu bisa dilihat dan dicocokkan dengan saldo asli.
4. Kalender: tap tanggal → terlihat semua pengeluaran hari itu.
5. Satu klik ekspor → Google Sheet (rekap, detail, harian, pagu internal) + foto bon di folder Drive dengan link per baris.
6. Biaya: Rp0 (semua layanan memakai free tier).

### Di luar scope v1

Mode offline/sync, multi-user/role, scan mutasi bank multi-transaksi, migrasi data dari `udp-tracker` lama (proyek ini mulai dari nol), dark mode.

## 2. Stack

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router), TypeScript, `src/` |
| UI | Tailwind CSS v4, shadcn/ui (Base UI) + **NeoBrutalism** (dulu bernama RetroUI; registry `https://neobrutalism.com/r/{name}.json`), disalin oleh `scripts/ui-sync.mts` |
| Client data | TanStack Query v5 (`useQuery`/`useMutation`, hydration dari server) |
| DB | Neon Postgres (free, region Singapura `ap-southeast-1`, di-link via Neon CLI `neon.ts`) + **Drizzle ORM** dengan `drizzle-orm/node-postgres` + `pg` Pool + `attachDatabasePool` (`@vercel/functions`) — rekomendasi skill Neon untuk Vercel Fluid compute; app memakai `DATABASE_URL` (pooled), migrasi memakai `DATABASE_URL_UNPOOLED` (direct). Migrasi `drizzle-kit` |
| File bon | Vercel Blob (free tier) |
| OCR | Google Gemini API free tier (structured JSON output), model via env |
| Laporan | Google Sheets + Drive API (`googleapis`), OAuth akun pengguna, scope `drive.file` |
| Validasi | zod |
| Test | Vitest + PGlite (Postgres in-memory) |
| Hosting | Vercel Hobby (free) |

Selalu memakai versi **latest** (dicek 2026-10-21: next 16.4.2, react 19.3, drizzle-orm 0.45.4, drizzle-kit 0.31.11, pg 8.23.1, @vercel/functions 3.10.2, @electric-sql/pglite 0.5.10, @tanstack/react-query 5.104.5, zod 4.6.7, vitest 5.0.5, shadcn 4.22.1, @types/node 24). Sebelum menulis kode yang bergantung pada API Next.js 16, baca dokumentasi di `node_modules/next/dist/docs/`.

Catatan Next.js 16.4: `create-next-app` mengaktifkan `cacheComponents` dan `partialPrefetching` secara default. Semua pembacaan DB/cookies di halaman wajib berada di dalam `<Suspense>` (sesuai pola `sections/`). GET Route Handler yang membaca cookies/DB otomatis dinamis. `middleware` diganti `proxy.ts`. `params` adalah `Promise`.

**Peringatan keamanan:** repo GitHub `Logging-Stuff/RetroUI` (yang di-link template shadcn.io) sudah diambil alih (repo-jacking) dan sekarang berisi PoC peneliti keamanan. Jangan clone repo itu. Proyek aslinya pindah ke `github.com/neobrutalism/neobrutalism` (MIT) dan `retroui.dev` mengarah ke `neobrutalism.com`.

## 3. Model domain

Semua nominal adalah **integer rupiah** (tidak ada float). Agregasi (saldo, total, pagu) dihitung di `lib/` (fungsi murni) dari baris transaksi proyek. Satu proyek berisi ratusan baris, dan `number` JS aman sampai 9×10¹⁵. Tidak ada `SUM` di SQL, sehingga perbedaan tipe `bigint` antara Neon dan PGlite tidak jadi masalah. Tanggal transaksi bertipe `date` (`YYYY-MM-DD`) dan ditafsirkan dalam zona **WIB (Asia/Jakarta)**. Setiap tabel punya `id` (uuid), `createdAt`, dan `updatedAt`.

### 3.1 Tabel

**projects**
- `name`, `location`, `startDate`, `endDate`, `pax` (int, wajib diisi saat membuat proyek; form tanpa angka bawaan, mulai dengan 1 mobil), `status` (`active` | `done`)
- `driveFolderId?`, `sheetId?`, `sheetUrl?` (diisi saat ekspor)
- `startDate`/`endDate` (inklusif) menentukan jumlah hari untuk pagu.

**vehicles**
- `projectId`, `name` (mis. "Mobil 1 – Innova"; unik per proyek), `plate?`, `sortOrder`. Maksimal 5 mobil per proyek.

**wallets** (dompet)
- `projectId`, `kind` (`bank` | `cash` | `flazz` | `ewallet`), `name`, `holder?` (teks bebas), `vehicleId?` (untuk Flazz), `openingBalance` (int, default 0), `sortOrder`, `archived` (bool)

**categories**
- `projectId`, `kind` (`expense` | `income`), `name`, `icon` (nama ikon lucide), `isVehicleRelated` (bool; jika true, form menampilkan pilihan mobil), `isAdminFee` (bool; tepat satu per proyek), `isOfficeFunding` (bool; pemasukan dari kantor, default: UDP Kantor), `sortOrder`, `archived`

**budgets** (pagu)
- `projectId`, `name`, `rate` (int), `basis` (`per_pax_per_day` | `per_vehicle_per_day` | `per_vehicle` (per mobil per trip, tidak dikali hari) | `per_day` | `lump_sum`), `days?` (basis harian: jumlah hari khusus pagu, mis. 6 hari kerja, kosong = periode proyek; `per_vehicle`: jumlah trip, mis. 2 = pergi + pulang, kosong = 1), `note?`. Nama pagu unik per proyek.
- **budget_categories**: relasi many-to-many `budgetId` ↔ `categoryId`. Satu pagu bisa mencakup beberapa kategori.
- Nilai pagu: `rate × multiplier`, dengan multiplier `pax × hari`, `jumlahMobil × hari`, `hari`, `jumlahMobil × trip` (per_vehicle), atau `1`. `hari` = `days` pagu bila diisi, selain itu jumlah hari periode proyek.

**transactions**
- `projectId`, `type` (`expense` | `income` | `transfer`), `date`, `amount` (int > 0)
- `categoryId?` (wajib untuk expense/income; null untuk transfer)
- `walletId` (dompet sumber untuk expense/transfer, tujuan untuk income)
- `toWalletId?` (wajib untuk transfer, ≠ `walletId`)
- `adminFee` (int ≥ 0, hanya untuk transfer, default 0)
- `vehicleId?`, `merchant?`, `note?`
- `balanceCheckId?` (diisi jika transaksi penyesuaian dari cek saldo)
- `deletedAt?` (soft delete)

**attachments**
- `transactionId`, `blobUrl`, `blobPathname`, `mimeType`, `sizeBytes`, `ocrJson?` (hasil scan yang sudah divalidasi), `driveFileId?`, `driveUrl?`

**balance_checks** (cek saldo)
- `walletId`, `date`, `actualBalance` (int), `computedBalance` (int, snapshot saat cek), `note?`

**google_credentials**
- `id` = `'default'`, `data` (refresh token + scope + email, terenkripsi AES-256-GCM), `account`

**login_attempts**
- `ip`, `attemptedAt`, `success` (bool). Dipakai untuk rate limit login (§7). Baris > 1 hari boleh dihapus.

### 3.2 Seed default saat membuat proyek

- **Dompet:** Rekening (bank), Cash (cash), Flazz {Mobil n} (flazz, satu per mobil yang dibuat).
- **Kategori pengeluaran:** Makan Siang, Makan Malam, Sarapan, Snack & Air Minum, BBM Perjalanan, Bensin Harian, Tol, Parkir (empat terakhir `isVehicleRelated`), Biaya Admin (`isAdminFee`), Lain-lain.
- **Kategori pemasukan:** UDP Kantor, Lainnya.
- **Pagu:** tidak ada pagu bawaan. Pengguna menambah pagu sendiri per proyek (Lainnya → Pagu). Kelebihan satu pagu ditampilkan netral "Lebih pagu Rp X", karena bisa tertutup sisa pagu lain (lihat kartu Total pagu di beranda).

### 3.3 Aturan perhitungan (pure, di `lib/`)

- **Saldo dompet** = `openingBalance + Σincome(wallet) − Σexpense(wallet) + Σtransfer masuk(amount) − Σtransfer keluar(amount + adminFee)`. Hanya baris dengan `deletedAt` null yang dihitung.
- **Biaya admin transfer** dilaporkan sebagai pengeluaran pada kategori `isAdminFee` (tanggal dan dompet sama dengan transfer). Biaya ini **tidak** disimpan sebagai baris transaksi kedua.
- **Total pengeluaran** = `Σexpense.amount + Σtransfer.adminFee`.
- **UDP diterima** = Σincome pada kategori ber-flag `isOfficeFunding` (default "UDP Kantor"; tidak bergantung pada nama). **Total pemasukan** = Σ semua income.
- **Sisa** = `Σ openingBalance + total pemasukan − total pengeluaran`. Positif berarti dikembalikan ke kantor, negatif berarti kurang dan perlu di-reimburse.
- **Realisasi pagu** = Σ pengeluaran pada kategori yang tercakup. **Selisih** = pagu − realisasi. Jika negatif, ditampilkan sebagai "Lebih pagu Rp |selisih|". **Total pagu** = Σ batas semua pagu dibandingkan dengan Σ realisasinya (tiap pengeluaran dihitung sekali walau kategorinya tercakup di beberapa pagu).
- **Pagu makan harian** (kalender) = `rate × pax` dibandingkan dengan realisasi kategori tercakup di tanggal itu.
- **Cek saldo:** `selisih = actualBalance − computedBalance(wallet, s/d date)`. Aksi "Catat selisih" membuat transaksi penyesuaian:
  - selisih < 0 → expense sebesar |selisih|, kategori dipilih pengguna (default: Tol untuk Flazz, Lain-lain untuk lainnya), catatan "Penyesuaian cek saldo";
  - selisih > 0 → income kategori Lainnya.

### 3.4 Aturan bisnis (di `services/`)

- Proyek `done` menolak semua mutasi (kecuali membuka kembali proyek).
- Transfer: `toWalletId` wajib dan ≠ `walletId`. `categoryId` harus null.
- Expense/income: `categoryId` wajib dan `kind` kategori harus cocok dengan `type`.
- `vehicleId` hanya boleh diisi jika kategori `isVehicleRelated`.
- Semua entitas yang direferensikan harus milik `projectId` yang sama.
- `date` harus valid. Tanggal di luar rentang proyek diizinkan dengan peringatan (bukan error).
- **Kategori:** nama unik per proyek (tidak peka huruf besar/kecil), jenis (`expense`/`income`) tidak bisa diubah, `isVehicleRelated` hanya untuk pengeluaran. Kategori sistem (`isAdminFee`, `isOfficeFunding`) tidak bisa diarsipkan. Kategori tidak dihapus, hanya diarsipkan.
- **Mobil:** menambah mobil ikut membuat dompet "Flazz {mobil}"; ganti nama mobil ikut mengganti nama dompet Flazz yang masih bernama bawaan. Mobil boleh dihapus (dengan konfirmasi) hanya jika tidak dipakai transaksi aktif dan dompet Flazz-nya kosong (saldo awal 0, tanpa transaksi termasuk yang terhapus); dompet itu ikut dihapus. Selain itu 409.
- **Hapus proyek** = hapus permanen beserta seluruh datanya, wajib password aplikasi (diverifikasi lewat `login()`, jadi ikut rate limit §7). Proyek `done` pun boleh dihapus. Transaksi dihapus dulu (FK transaksi → dompet/kategori `RESTRICT`), lalu proyek (cascade sisanya). Foto bon di Blob ikut dihapus setelah commit.
- Hapus transaksi = soft delete. Urungkan = set `deletedAt` null. File Blob lampiran ikut dihapus (setelah commit, best effort) saat lampiran dilepas dari transaksi atau proyek dihapus; transaksi yang di-soft delete tetap menyimpan bonnya. Blob yatim (upload yang transaksinya batal disimpan) dibersihkan `npm run blob:cleanup` (`scripts/cleanup-blobs.mts`; dry run, `-- --hapus` untuk menghapus, hanya file > 24 jam).

## 4. Arsitektur & folder

Mengikuti kontrak `srikandi-merdeka-cup/docs/architecture/data-flow.md`. Kontrak itu disalin ke `docs/architecture/data-flow.md` di repo ini **beserta adaptasi di bawah**, yang dicatat sebagai pengecualian terdokumentasi.

### 4.1 Struktur

```text
src/
  app/
    (app)/layout.tsx            shell: bottom nav + tombol + (FAB) + QueryClientProvider
    (app)/page.tsx              → modules/dashboard
    (app)/kalender/page.tsx     → modules/calendar
    (app)/transaksi/page.tsx    → modules/transactions
    (app)/lainnya/**            → wallets, budgets, projects, report, google-auth
    login/page.tsx
    api/**/route.ts             satu-satunya HTTP boundary
  modules/
    projects/ transactions/ wallets/ budgets/ dashboard/ calendar/
    receipts/ report/ google-auth/ auth/ shared/
      (tiap module memakai subset dari:)
      index.tsx views/ sections/ queries/ commands/ services/ api/
      mappers/ lib/ types/ components/ hooks/
  components/
    ui/        komponen NeoBrutalism (ex-RetroUI) — TIDAK PERNAH diedit, diverifikasi `npm run ui:check`
    app/       wrapper/compose milik app (MoneyInput, BottomNav, DayDrawer, CategoryGrid, WalletChip, …)
  db/
    schema.ts  client.ts (server-only)  migrations/
  lib/
    query-client.tsx  env.ts (zod-validated env)  crypto.ts  session.ts
  proxy.ts
```

Tanggung jawab folder sama dengan kontrak srikandi, plus empat adaptasi berikut.

### 4.2 Adaptasi kontrak

1. **`commands/` (alur tulis).** Kontrak srikandi hanya mendefinisikan alur baca. `commands/` adalah pasangan `queries/` untuk sisi tulis: server-only, mengorkestrasi satu use case mutasi di dalam satu DB transaction, dan memanggil service.
2. **`api/` = adapter, termasuk repo DB.** Fungsi Drizzle per tabel diperlakukan sebagai adapter transport: hanya query/insert, mengembalikan row mentah. Adapter eksternal: `gemini`, `google-drive`, `google-sheets`, `blob`.
3. **Cache.** Tidak ada `'use cache'` persisten untuk data keuangan karena data harus fresh setelah mutasi. Otoritas kesegaran adalah DB. React `cache()` hanya untuk dedupe per request. Cache browser dipegang TanStack Query dan di-invalidate pada `onSuccess` mutasi.
4. **`hooks/` (client-only).** Berisi hook TanStack Query dan *query key factory* yang client-safe. Hook hanya memanggil `/api/*` dan tidak boleh mengimpor modul `server-only`.

### 4.3 Alur data

**Baca (render server):**
```text
page → module index → view → section → query → service → api (repo/adapter) → Neon/eksternal
section: prefetch hasil query ke QueryClient → <HydrationBoundary> → client component (useQuery)
```

**Baca (refresh dari client):**
```text
useQuery (hooks/) → GET /api/... (parse + cek sesi) → query yang SAMA → service → api
```

**Tulis:**
```text
form → useMutation (hooks/) → POST/PATCH/DELETE /api/... (parse HTTP + cek sesi)
  → command (db.transaction) → service (zod + aturan bisnis) → api (repo) → Neon
onSuccess → invalidate key: summary, wallets, calendar(month), transactions
```

Trust boundary: row DB, JSON Gemini, dan respons Google masuk lewat `mappers/` sebelum mencapai `lib/` atau komponen. Semua modul `queries/`, `commands/`, `services/`, dan `api/` mengimpor `server-only`.

### 4.4 Endpoint internal

Semua di bawah `/api/projects/[projectId]/…` kecuali yang ditandai.

| Endpoint | Metode | Fungsi |
| --- | --- | --- |
| `/api/projects` *(global)* | GET, POST | daftar proyek, buat proyek (+ seed) |
| `…/activate` | POST | set cookie proyek aktif |
| `…/` | GET, PATCH, DELETE | detail, ubah pengaturan/status / hapus permanen (body `{ password }`) |
| `…/settings` | GET | data halaman pengaturan: proyek + mobil (`removable`, nama dompet Flazz) |
| `…/summary` | GET | kartu beranda: UDP masuk, pengeluaran, sisa, saldo per dompet, pagu |
| `…/calendar?month=YYYY-MM` | GET | total per tanggal untuk bulan itu |
| `…/days/[date]` | GET | transaksi + subtotal kategori + pagu makan hari itu |
| `…/transactions` | GET, POST | list semua transaksi aktif (filter dilakukan di browser: jenis, kategori, dompet, mobil, cari) / buat |
| `…/transactions/[id]` | GET, PATCH, DELETE | detail / ubah / soft delete |
| `…/reference` | GET | data form: dompet & kategori aktif, mobil, dompet pengeluaran terakhir |
| `…/transactions/[id]/restore` | POST | urungkan hapus |
| `…/wallets` | GET, POST | daftar dompet (saldo, nama mobil, termasuk arsip) / tambah |
| `…/wallets/[walletId]` | GET, PATCH | detail (saldo, riwayat saldo harian, cek saldo, kategori) / ubah & arsip |
| `…/wallets/[walletId]/balance-checks` | GET, POST | riwayat & buat cek saldo (snapshot saldo s/d tanggal) |
| `…/balance-checks/[checkId]/adjust` | POST | catat selisih sebagai transaksi (`balanceCheckId`; 409 bila cocok/sudah dicatat) |
| `…/budgets` | GET, POST | pengaturan pagu (rumus, batas, pemakaian, kategori pengeluaran) / tambah |
| `…/budgets/[budgetId]` | PATCH, DELETE | ubah / hapus pagu |
| `…/categories` | GET, POST | daftar (termasuk arsip) / tambah kategori |
| `…/categories/[categoryId]` | PATCH | ubah & arsip |
| `…/vehicles` | GET, POST | daftar / tambah mobil (+ dompet Flazz) |
| `…/vehicles/[vehicleId]` | PATCH, DELETE | ubah / hapus (409 bila sudah dipakai) |
| `…/export` | POST | ekspor ke Google Sheets + Drive |
| `…/receipts` | POST | multipart `file` → simpan ke Blob private + scan Gemini (§6.1) |
| `…/attachments/[attachmentId]` | GET | stream file lampiran dari Blob private |
| `/api/auth/login`, `/api/auth/logout` | POST | sesi aplikasi |
| `/api/auth/google/start`, `/api/auth/google/callback` | GET | OAuth Google |

## 5. Layar & UX

Desain mobile-first (target lebar 360–430px), tetap rapi di desktop (kolom tengah maksimal ±480px). Gaya NeoBrutalism: border hitam tebal, hard shadow, warna aksen tegas. Target sentuh minimal 44px. Format angka `Rp 1.350.000`, tanggal `Sel, 21 Okt`.

**Shell:** bottom nav berisi Beranda · Kalender · **[+]** · Transaksi · Lainnya. Header menampilkan nama proyek aktif (tap → ganti proyek). Proyek aktif disimpan di cookie.

**Beranda**
- Kartu ringkasan: UDP diterima, total pengeluaran, sisa (dengan label "dikembalikan"/"kurang").
- Kartu saldo per dompet, dengan Flazz menampilkan nama mobil. Tap → detail dompet & cek saldo.
- Kartu Total pagu (Σ batas vs Σ realisasi) dan progress per pagu (hijau < 80%, kuning 80–100%, merah > 100% + "Lebih pagu Rp X").
- 5 transaksi terakhir + "Lihat semua".

**Kalender**
- Grid bulan (Senin di kolom pertama), panah ganti bulan, default bulan yang berisi hari ini atau `startDate` proyek. Rentang tanggal proyek diberi highlight.
- Tiap sel menampilkan total pengeluaran hari itu (termasuk biaya admin transfer) secara ringkas (`1,2jt`, `850rb`).
- Tap tanggal → drawer bawah: daftar transaksi hari itu, subtotal per kategori, dan "Pagu makan: Rp 1.350.000 · Realisasi Rp X". Tombol "+ Catat di tanggal ini" membuka form dengan tanggal terisi.

**Transaksi**
- List dikelompokkan per tanggal (terbaru di atas) dengan subtotal harian.
- Filter chip: jenis, kategori, dompet, mobil, plus pencarian (toko/catatan).
- Tap baris → form edit. Hapus menampilkan toast "Urungkan".
- Ikon klip ditampilkan pada transaksi yang punya bon. Transaksi pengeluaran tanpa bon diberi badge "tanpa bon".

**Form transaksi** (halaman penuh `/transaksi/baru` dan `/transaksi/[id]`, dari [+], kalender, atau daftar; query `tanggal` mengisi tanggal, `dari` menentukan halaman tujuan setelah simpan; halaman agar tombol back HP berfungsi)
1. Tombol besar **📷 Scan Bon** (kamera/galeri, menerima gambar & PDF). Thumbnail lampiran bisa >1.
2. Segmented: Pengeluaran / Pemasukan / Transfer.
3. Nominal (`inputmode="numeric"`, format otomatis).
4. Tanggal (default hari ini WIB, atau tanggal dari kalender).
5. Expense/income: grid ikon kategori. Transfer: dompet asal → tujuan + biaya admin (preset Rp0 / 2.500 / 6.500 + isian bebas).
6. Dompet (chip). Default: dompet terakhir yang dipakai. Jika kategori Tol dan mobil dipilih, default ke Flazz mobil itu.
7. Mobil (muncul hanya untuk kategori `isVehicleRelated`).
8. Berita (toko/penerima/keterangan), catatan.
9. Field yang diisi OCR diberi badge "cek lagi" sampai pengguna menyentuhnya.

**Lainnya**
- Dompet (`/lainnya/dompet`): daftar dengan saldo, tambah/ubah/arsip (arsip bisa dibalik; dompet tidak dihapus). Detail (`/lainnya/dompet/[id]`, juga dari tap saldo di beranda): saldo, **Cek Saldo** (tanggal + saldo asli → pratinjau saldo aplikasi s/d tanggal & selisih → simpan), riwayat cek saldo, "Catat selisih" (pilih kategori, default Tol untuk Flazz / Lain-lain / Lainnya) hanya pada cek terbaru.
- **Pagu** (`/lainnya/pagu`): kartu per pagu (tarif, rumus → batas, bar pemakaian, kategori), ubah inline dengan pratinjau rumus, tambah pagu, isian jumlah hari per pagu (kosong = periode proyek) atau jumlah trip untuk basis per mobil, hapus dengan konfirmasi dua langkah, empty state saat belum ada pagu.
- Kategori (`/lainnya/kategori`): daftar per jenis, tambah/ubah (nama, ikon, terkait mobil), arsip/buka arsip.
- Pengaturan proyek (`/lainnya/proyek`): nama, lokasi, tanggal, pax, status Selesai/Buka lagi; kelola mobil (tambah/ubah/hapus dengan konfirmasi); zona bahaya "Hapus proyek" (ketik password).
- Ganti / buat proyek (`/proyek`): daftar & buat proyek baru.
- Google: status koneksi (email), Hubungkan/Putuskan.
- Ekspor: tombol "Ekspor ke Google Sheets", status, link Sheet & folder terakhir.
- Keluar.

**Login:** satu field password.

### 5.1 Aturan komponen NeoBrutalism

- Komponen NeoBrutalism disalin apa adanya ke `src/components/ui/` oleh `npm run ui:sync` (daftar komponen di `ui.config.json`) dan **tidak pernah diedit**. `npm run ui:check` gagal jika ada file yang berbeda dari registry. `shadcn add` tidak dipakai untuk komponen ini karena CLI me-resolve dependensi tanpa namespace (mis. `button`) ke registry default shadcn, sehingga versi NeoBrutalism tertimpa (terbukti saat uji 2026-10-21). `components.json` tetap mendaftarkan registry `@neobrutalism` agar shadcn MCP bisa mencari/melihat komponen.
- Komponen NeoBrutalism dibangun di atas **Base UI** (bukan Radix). Gunakan prop `render`, bukan `asChild`.
- Kustomisasi dilakukan di `src/components/app/` dengan membungkus/meng-compose (props, `className`, slot), **bukan** dengan menyalin lalu mengubah isi komponen asli.
- Token tema (warna, font, radius, shadow) didefinisikan di `globals.css` lewat CSS variables. Override dilakukan di layer token, bukan di komponen.

## 6. Integrasi

### 6.1 Upload & scan bon

```text
pilih file → kompres di browser (gambar: sisi terpanjang ≤ 1600px, JPEG q≈0.8; PDF: apa adanya)
  → POST /api/projects/{projectId}/receipts (multipart `file`, ≤ 4 MB; image/jpeg|png|webp, application/pdf)
       → services/upload-receipt
            ├─ api/blob: put private → receipts/{projectId}/{uuid}.{ext}
            └─ api/gemini (byte yang sama, inline base64) → mappers/receipt-scan (null bila tidak masuk akal)
  ← { attachment: { pathname, blobUrl, mimeType, sizeBytes },
      scan: { ok: true, scan: { date, amount, merchant, categoryHint, confident } } | { ok: false, reason } }
simpan transaksi → input `attachments: [{ ...attachment, ocr }]` → baris `attachments`
```

- **Store Blob private** (keputusan implementasi 2026-10-21: store pengguna dikonfigurasi private). File dibaca lewat `GET /api/projects/{projectId}/attachments/{id}`, yang mengecek sesi lalu men-stream dari Blob. Pratinjau sebelum disimpan memakai object URL di browser.
- **Upload dan scan dalam satu request lewat server** (bukan client upload + token): HP cukup mengunggah sekali. Konsekuensinya batas **4 MB** per file (batas body fungsi Vercel 4,5 MB). Foto yang sudah dikompres hanya ±300 KB; PDF > 4 MB ditolak dengan pesan jelas.
- `api/gemini` memakai REST `generateContent` dengan `responseMimeType: application/json` + `responseSchema` (`categoryHint` berupa enum nama kategori pengeluaran aktif) + `thinkingLevel: "low"`. Model dari `GEMINI_MODEL` (daftar dipisah koma), default `gemini-flash-latest,gemini-flash-lite-latest` (per 2026-10-21 → `gemini-3.8-flash`, cadangan `gemini-3.5-flash-lite`; `gemini-2.5-flash` sudah tidak tersedia untuk akun baru). Model berikutnya dicoba bila model sebelumnya **sibuk (5xx, mis. 503 "high demand"), kuota habis (429), atau timeout**. Satu model maksimal 30 detik, total 55 detik (route `maxDuration = 60`). Scan normal ±8–13 detik, tapi saat Gemini ramai bisa 25–45 detik.
- Isi prompt (Bahasa Indonesia) mencakup: format rupiah Indonesia (`.` pemisah ribuan, `,` desimal), ambil **total yang dibayar** (bukan subtotal/pajak/kembalian/tunai), format tanggal `dd/mm/yy`, nama bulan Indonesia, tahun proyek bila tahun tidak tertulis, struk SPBU/tol/parkir, kwitansi tulisan tangan, dan `null` jika tidak yakin.
- Mapper mengubah jadi `null`: nominal ≤ 0, > 100.000.000, atau bukan bilangan bulat; tanggal tidak valid atau tahunnya di luar ±1 dari tahun proyek; `categoryHint` di luar kategori proyek. `confident` hanya true bila Gemini yakin dan nominal terbaca.
- Gagal/sibuk/kuota habis/timeout/key kosong → `{ ok: false, reason: "failed" | "busy" | "quota" | "timeout" | "unconfigured" }`; UI menampilkan toast "… isi manual". Lampiran tetap tersimpan.
- Form hanya mengisi field yang masih kosong (nominal, tanggal bila masih default, toko, kategori untuk pengeluaran). Field itu diberi badge "cek lagi" sampai disentuh. Maksimal 5 lampiran per transaksi; hapus thumbnail dengan konfirmasi dua langkah.
- Lampiran divalidasi server: pathname harus `receipts/{projectId ini}/{uuid}.{ext}` dan `blobUrl` harus di host `*.private.blob.vercel-storage.com` dengan path yang sama.

### 6.2 Ekspor Google Sheets + Drive

**Auth:** OAuth 2.0 Web client (memakai client yang sama dengan mkk-dashboard, dengan redirect URI `{origin}/api/auth/google/callback` ditambahkan), `access_type=offline`, `prompt=consent`. Scope: `drive.file`, `openid`, `email`. Refresh token disimpan terenkripsi di `google_credentials`. Helper `gcall` (retry eksponensial 2–32 detik untuk 403/429 rate limit) diadaptasi dari mkk-dashboard. Token invalid (`invalid_grant`) → pesan "Hubungkan ulang akun Google" + tombol.

**Langkah `commands/export-report`:**
1. Pastikan folder Drive `UDP – {nama proyek}` dan subfolder `Bon` ada (buat jika `driveFolderId` kosong).
2. Untuk setiap attachment tanpa `driveFileId`: unduh dari Blob → upload ke `Bon/` dengan nama `{YYYY-MM-DD}_{no urut 3 digit}_{Kategori}_{nominal}.{ext}` → simpan `driveFileId`/`driveUrl`.
3. Buat spreadsheet baru `UDP – {nama proyek} – {YYYY-MM-DD}` di folder proyek, locale `in_ID`, timezone `Asia/Jakarta`.
4. Tulis 4 tab (nilai angka sebagai angka, format `#,##0`, header tebal + freeze baris header):
   - **Rekap:** info proyek (nama, lokasi, periode, pax, mobil), daftar UDP masuk (tanggal, nominal, dompet), total pemasukan, total pengeluaran per kategori (termasuk Biaya Admin), saldo akhir per dompet, Sisa (dikembalikan/kurang).
   - **Detail:** No · Tanggal · Jenis · Kategori · Berita · Dompet · Mobil · Masuk · Keluar · Saldo berjalan (gabungan semua dompet) · Bon (`=HYPERLINK(url;"Bon 1")`, kolom tambahan untuk lampiran ke-2+). Transfer ditampilkan sebagai satu baris "Transfer A → B" (Masuk = Keluar = 0, kecuali admin di kolom Keluar).
   - **Harian:** baris = tanggal, kolom = kategori pengeluaran, baris total.
   - **Pagu (internal):** per pagu: nilai pagu, realisasi, selisih/ditanggung kantor. Untuk Pagu Makan juga ada rincian per hari.
5. Setelah semua tab berhasil ditulis: jika ada `sheetId` lama, rename Sheet lama menjadi `… (lama {YYYY-MM-DD})`.
6. Simpan `sheetId`/`sheetUrl` baru, lalu kembalikan URL Sheet + folder.

Ekspor bersifat idempoten untuk foto (tidak diunggah dua kali) dan aman diulang. Kegagalan di tengah proses dikembalikan sebagai error yang jelas. Sheet yang setengah jadi diberi akhiran `(GAGAL {tanggal})`.

## 7. Auth aplikasi

- `APP_PASSWORD_HASH` (argon2id) di env. `POST /api/auth/login` memverifikasi password lalu menyetel cookie sesi httpOnly, `Secure`, `SameSite=Lax`, ditandatangani HMAC (`SESSION_SECRET`), berlaku 30 hari.
- `src/proxy.ts` mengalihkan request tanpa sesi ke `/login` (halaman) atau mengembalikan 401 (`/api/*`). Pengecualian: `/login`, `/api/auth/login`, `/api/auth/google/callback`, aset statis.
- Setiap route API tetap memverifikasi sesi di server (*defense in depth*).
- Login dibatasi 5 percobaan gagal per 15 menit per IP (counter di DB).
- Script `scripts/hash-password.ts` membuat hash untuk env.

## 8. Error handling

- **Missing:** proyek/transaksi tidak ditemukan → `notFound()` (halaman) / 404 (API).
- **Empty:** tanpa transaksi → empty state dengan CTA. Kalender kosong tetap menampilkan grid.
- **Failed:** error DB/Gemini/Google → error boundary per section (section lain tetap tampil, ada tombol "Coba lagi") dan tidak diubah menjadi data kosong.
- **Validasi:** service melempar `ValidationError` berisi error per field. Route mengembalikan 422 `{ fieldErrors }` dan form menampilkannya di bawah input. Isi form tidak hilang saat mutasi gagal.
- **Konflik bisnis** (proyek terkunci, dsb.) → 409 dengan pesan Bahasa Indonesia.
- Pesan error untuk pengguna dalam Bahasa Indonesia. Log server menyertakan konteks (projectId, route), tanpa token/secret.

## 9. Testing

- **Vitest unit (`lib/`):** saldo dompet (termasuk transfer + admin, soft delete), total pengeluaran, sisa, pagu (`per_pax_per_day` dll.), "ditanggung kantor", pagu harian, grouping kalender per tanggal WIB, format/parse rupiah, penamaan file bon.
- **Mapper:** variasi JSON Gemini (nominal string `"Rp 75.000"`, `"75.000,00"`, null, tanggal tidak valid, field hilang, tahun salah) → hasil kanonik/`null`/ditolak.
- **Service + command (PGlite + migrasi Drizzle yang sama):** buat proyek + seed, transfer ke dompet yang sama ditolak, kategori salah jenis ditolak, proyek `done` ditolak, soft delete + restore, cek saldo + catat selisih, export (adapter Google & Blob di-mock): idempoten untuk foto.
- **Route:** parse input dan 401 tanpa sesi.
- Tidak ada test yang memanggil Gemini/Google/Blob/Neon asli.

## 10. Konfigurasi & deploy

`.env.example`:

```text
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
GEMINI_API_KEY=
GEMINI_MODEL=                 # default gemini-flash-latest
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
# GOOGLE_OAUTH_REDIRECT_URI=   # default {origin}/api/auth/google/callback
ENCRYPTION_KEY=                # 32 byte base64, untuk refresh token Google
APP_PASSWORD_HASH=
SESSION_SECRET=
```

- `src/lib/env.ts` memvalidasi env dengan zod saat start.
- Vercel Hobby + integrasi Neon (`DATABASE_URL` otomatis) + Vercel Blob store.
- `drizzle-kit generate` menghasilkan migrasi yang di-commit. Migrasi dijalankan lewat `npm run db:migrate` (lokal dan sebagai langkah build di Vercel).
- PWA: `manifest.webmanifest` (nama, ikon, `display: standalone`, theme color NeoBrutalism) agar bisa "Add to Home Screen". Tanpa service worker/offline di v1.
- Dokumentasi: `README.md` (setup lokal, env, Google OAuth, Gemini key, deploy), `docs/architecture/data-flow.md` (kontrak + adaptasi §4.2).

## 11. Risiko & catatan

- **OAuth mode Testing:** refresh token Google kedaluwarsa setiap 7 hari. Mitigasinya alur "Hubungkan ulang" yang jelas. Bisa juga dengan mem-publish consent screen.
- **Gemini free tier:** ada batas kuota/rate, dan data free tier dapat dipakai Google untuk peningkatan produk (diterima untuk foto bon). Input manual selalu tersedia.
- **Kuota Vercel Blob free:** kompresi di browser menjaga ukuran tetap kecil (~200–300KB per foto).
- **Sinyal lapangan:** v1 butuh koneksi. Saat offline, form tidak di-reset dan pengguna bisa mencoba simpan lagi.
