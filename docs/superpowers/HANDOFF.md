# Handoff — UDP Tracker (per 2026-10-21)

Baca ini dulu di chat baru, lalu spec dan rencana yang ditautkan di bawah.

## Status

| Bagian | Status |
| --- | --- |
| Rencana 1 Fondasi (`docs/superpowers/plans/2026-10-21-01-fondasi.md`) | ✅ merged ke `main` (PR #1) |
| Rencana 2a Buku kas (`…/2026-10-21-02a-buku-kas.md`) | ✅ merged ke `main` (PR #2) |
| Rencana 2b-1 Pagu (`…/2026-10-21-02b1-pagu.md`) | ✅ merged (PR #2). Bagian "surat penawaran" sudah dibuang di PR #3 |
| Pagu generik: jumlah hari per pagu, tanpa seed pagu | ✅ merged (PR #3; migrasi 0003 sudah di Neon) |
| Rencana 2b-2 Dompet & cek saldo (`…/2026-10-21-02b2-dompet.md`) | ✅ merged (PR #4; juga: form proyek baru tanpa pax bawaan, 1 mobil) |
| Rencana 2b-3 Kategori, mobil, pengaturan & hapus proyek (`…/2026-10-21-02b3-pengaturan.md`) | ✅ merged (PR #5). Spec sudah disinkronkan (branch `docs/sync-spec`) |
| Rencana 3 Scan bon (`…/2026-10-21-03-scan-bon.md`) | ✅ merged (PR #9; juga: fallback model Gemini, DatePicker kalender NeoBrutalism, dialog foto bon, `allowedDevOrigins` rentang IP privat) |
| Tipografi & font ikut neobrutalism.com/blocks | ✅ merged (PR #11): Space Grotesk + Geist, kelas di `src/components/app/typography.ts`, filter jenis transaksi pakai `Tabs` |
| Jam transaksi (`…/2026-10-21-05-jam-transaksi.md`) | ✅ di `main`. Kolom `transactions.time` wajib (`HH:mm` WIB, 24 jam, tanpa label WIB di UI); migrasi 0004 sudah di Neon (jam data lama = `created_at` WIB). Scan membaca jam; penyesuaian cek saldo = 23:59; `TimeInput` teks (bukan `type="time"` yang bisa AM/PM) |
| Rencana 4 Ekspor + PWA (`…/2026-10-22-06-ekspor.md`, addendum spec `2026-10-22-ekspor-design.md`) | ✅ di `main`, uji nyata lulus 2026-10-22 (proyek asli: 6 foto ke Drive, Sheet 4 tab). Lainnya → Ekspor laporan |
| Deploy Vercel (`sin1`) | ⏳ berikutnya |

**Langkah berikutnya:**

1. ✅ Spec disinkronkan dengan 2b-2/2b-3, PR #6–#8 (trip, Lebih pagu, Total pagu).
2. ✅ Rencana 3: Scan bon. Berikutnya: **Rencana 4 Ekspor** (spec §6.2) — lampiran punya kolom `driveFileId`/`driveUrl`; file dibaca lewat `readReceipt()`. Sheet transaksi menyertakan kolom Jam di sebelah Tanggal.
3. ✅ (PR #6) **Jumlah trip untuk basis `per_vehicle`** (permintaan pengguna): BBM + Tol = tarif × mobil × trip (pergi + pulang = 2). Pakai ulang kolom `budgets.days` sebagai "Jumlah trip" untuk `per_vehicle` (default 1; label form & `limitFormula` "× 2 trip"; `planBudget` tidak lagi menolkan `days` untuk `per_vehicle`). Sementara pengguna bisa isi tarif 2.600.000.
4. Pengguna mengisi "Jumlah hari" = 6 untuk Operasional Harian di proyek aslinya (data asli, jangan diubah tanpa izin).

**Deploy Vercel (langkah terakhir):** env produksi = semua isi `.env.local` (kecuali `NEON_BRANCH`), tambah redirect URI `https://<domain-vercel>/api/auth/google/callback` di OAuth client **milik UDP Tracker** (client baru, bukan client dashboard), lalu hubungkan Google sekali dari domain produksi. Migrasi DB: pengguna menjalankan `npm run db:migrate` (Claude Code menolak menyentuh Neon production).

## Dokumen kunci

- Spec: `docs/superpowers/specs/2026-10-21-udp-tracker-design.md` (sudah disinkronkan dengan semua keputusan)
- Kontrak folder/alur data: `docs/architecture/data-flow.md` (adaptasi dari `/Users/riski/Repo/srikandi-merdeka-cup/docs/architecture/data-flow.md`)
- Pola ekspor Google: `/Users/riski/Repo/dashboard` (`lib/connectors/google-oauth.ts`, `lib/reports/engine/sheets.ts`)

## Lingkungan

- Neon project `calm-lake-03611185`, branch `production`, region Singapura. Sudah di-link (`neon.ts`, `.neon/`). `.env.local` berisi `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`, `NEON_BRANCH`, `APP_PASSWORD_HASH`, `SESSION_SECRET` (dibuat pengguna). Migrasi: `npm run db:migrate` (0000–0004 sudah diterapkan). Claude Code menolak menjalankan `db:migrate` ke Neon production; minta pengguna menjalankan `! npm run db:migrate`.
- Pengguna menjalankan sendiri `npm run dev` di port **3051** (laptop: localhost:3051, HP: `http://<IP-laptop>:3051`). Jangan matikan proses itu.
- Data asli di Neon: 1 proyek "Q4 Hero & Editorial Feature Videos - Part 1".

## Fakta teknis yang sudah terbukti (hemat waktu, jangan ditemukan ulang)

- **Next.js 16.4**: `cacheComponents` aktif. Setiap section yang membaca DB/cookies memanggil `await connection()` di baris pertama. Kalau tidak, build gagal karena `env()` terbaca saat prerender. `usePathname`/`useSearchParams` di layout harus di dalam `<Suspense>` (lihat `AppShell` + `BottomNavLinks`). `middleware` → `src/proxy.ts`. `params` berupa Promise; pakai `RouteContext<"/api/…">` dan `PageProps<"/…">`.
- **Dev via IP**: `next.config.ts` mengisi `allowedDevOrigins` dengan IP LAN laptop. Tanpa itu halaman yang dibuka lewat IP tidak hydrate (tombol mati).
- **DB**: Drizzle + `pg` Pool + `attachDatabasePool` (rekomendasi skill Neon). Migrasi lewat `DATABASE_URL_UNPOOLED`. `withVerifiedSsl()` mengunci `sslmode=verify-full`. Test pakai PGlite (`tests/helpers/test-db.ts`). Fungsi server menerima `db: Db` sebagai parameter pertama.
- **UI**: komponen NeoBrutalism (ex-RetroUI, berbasis **Base UI**) disalin oleh `npm run ui:sync` ke `src/components/ui`, yang **tidak boleh diedit** (`npm run ui:check`). Jangan pakai `shadcn add`, karena CLI mengambil `button` dari registry default. Repo `Logging-Stuff/RetroUI` sudah di-repo-jack, jangan di-clone. `ToggleGroup` memakai `value` berupa array. `NativeSelect` butuh `NATIVE_SELECT_CLASS` (`src/components/app/form-classes.ts`). `DrawerContent className="mx-auto max-w-[480px]"`.
- **Next 16 menyimpan state halaman** (Cache Components menyembunyikan route dengan `<Activity>`, maks 3 route, per URL termasuk query): tutup drawer sebelum navigasi (lihat `DayDetailPanel onNavigate`); form "buat baru" pakai `useResetAfterSave` (`src/lib/use-reset-after-save.ts`) sebagai `key` agar kosong lagi setelah simpan, draf belum disimpan tetap ada. Dokumen: `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`. Default dari server (jam/tanggal) jangan dibandingkan dengan state (`state === defaultProp` gagal saat props lebih baru, dan props bisa basi dari cache router): pakai `useServerDefault` (`src/lib/use-server-default.ts`) dan `useNowTimeWib` untuk jam sekarang.
- Test komponen/hook React: file `*.test.tsx` dengan `// @vitest-environment happy-dom` (happy-dom dipin 20.14.5).
- **Chrome**: Enter setelah mengetik password kadang dimakan popup saran password bawaan. Ini bukan bug app.
- **Blob store private** (`put` public ditolak). Baca file lewat `readReceipt()`/route `attachments/[id]`, jangan pakai `blobUrl` langsung di browser. Skrip di luar app yang memakai drizzle wajib `casing: "snake_case"`.
- **Gemini**: default **`gemini-flash-lite-latest`** dulu, cadangan `gemini-flash-latest` (keputusan pengguna 2026-10-22: kuota/503 model utama sering habis). Lite cukup akurat dengan prompt sekarang (bukti transfer, dd/mm/yyyy, jam berdetik, `adminFee`/BI FAST Rp 2.500). Scan di form **Ubah** menimpa tanggal/jam ("cek lagi"); di form baru hanya bila belum diubah. Uji ulang foto yang sudah di Blob tanpa HP: skrip `rescan.mts` (list Blob → generateJson) dengan `NODE_OPTIONS=--conditions=react-server npx tsx --tsconfig tsconfig.json`. Pesan error asli tercatat di terminal dev (`[gemini] <model> <reason> …`). Struk uji sintetis bisa dibuat tanpa PIL: `cupsfilter struk.txt > struk.pdf` lalu `sips -s format jpeg struk.pdf --out struk.jpg`.
- **Seluruh angka** (saldo, total, pagu) dihitung di `lib/` dari `getLedger()`, bukan dengan SUM di SQL.
- **Google (ekspor):** OAuth client sendiri (dibuat pengguna 2026-10-22; redirect `http://localhost:3051/api/auth/google/callback`). Hubungkan hanya dari `localhost`/https (Google menolak IP LAN). Token terenkripsi (`ENCRYPTION_KEY`, khusus app ini) di `google_credentials`; Putuskan hanya menghapus token di DB. Consent screen mode Testing → token habis tiap 7 hari (ubah ke In production). Gateway googleapis di `src/modules/exports/api/google-gateway.ts`; isi laporan murni di `exports/lib/report.ts`.
- **Route handler GET tanpa params:** `route()` memanggil `await connection()` sebelum try/catch; tanpa itu build mencatat error prerender `cookies()`.
- **Uji route dengan sesi tanpa login:** buat token via `createSessionToken(SESSION_SECRET)` (skrip tsx di scratchpad) lalu `curl -H "Cookie: udp_session=…"`.

## Cara kerja yang dipakai (ikuti lagi)

- Superpowers: brainstorming → spec → writing-plans → executing-plans (inline), TDD per task, commit per task dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Commit langsung ke `main` lalu push, tanpa branch/PR** (sama seperti repo dashboard; keputusan pengguna 2026-10-21). Deploy hanya kalau pekerjaan sudah beres. Kalau Vercel sudah tersambung ke GitHub, push ke `main` = deploy, jadi cek dulu.
- Kode di dokumen rencana bisa disalin otomatis per task dengan skrip ekstraktor (cocokkan baris "`path`:" + blok kode). Skrip itu ada di scratchpad sesi lama, jadi buat ulang bila perlu.
- **Gerbang commit pakai exit code** (`npm run build > log; echo $?`), bukan `grep`. Di zsh, variabel berisi beberapa flag tidak dipecah: tulis skrip uji sebagai file bash.
- **E2E**: buat kredensial sementara (hash argon2 + secret acak di scratchpad, bukan `.env.local`), `next start -p 3100` dengan env proses, uji via curl. Untuk uji browser pakai **`127.0.0.1:3100`**, bukan `localhost`, karena cookie tidak dibedakan per port dan login uji akan menimpa sesi pengguna di localhost:3051. Hapus proyek "E2E %" dan `login_attempts` uji dari Neon setelahnya.
- Verifikasi penuh: `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`. Kalau laptop berat, tes DB (PGlite) bisa "Hook timed out in 10000ms": jalankan `npx vitest run --maxWorkers=4`.
- E2E: hapus proyek uji dengan menghapus `transactions` proyek itu dulu (FK transaksi → dompet/kategori `RESTRICT`), baru `projects` (cascade sisanya). Login di browser uji: `form_input` tidak memicu state React; ketik manual.
- Halaman `notFound()` di dalam section ber-Suspense membalas HTTP 200 (streaming PPR) dengan isi 404 — perilaku Next, sama di `/transaksi/[id]`.

## Preferensi pengguna

- **Aplikasi generik/reusable:** jangan hardcode tarif, seed, atau tombol migrasi khusus satu kontrak. Kebutuhan dari proyek pengguna dibuat versi umum yang bisa diatur di UI (contoh: "operasional 6 hari" → isian jumlah hari per pagu).
- Bahasa Indonesia santai. Hanya layanan gratis (Gemini free tier, Neon/Vercel free).
- **Aksi yang menghapus wajib ada konfirmasi** (pengguna pernah kecewa dengan tombol tanpa konfirmasi).
- Kelebihan satu pagu ditampilkan netral "Lebih pagu Rp X" (bukan "ditanggung kantor"), karena bisa tertutup sisa pagu lain di total pagu (keputusan pengguna 2026-10-21).
