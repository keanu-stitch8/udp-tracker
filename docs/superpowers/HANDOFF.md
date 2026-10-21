# Handoff — UDP Tracker (per 2026-10-21)

Baca ini dulu di chat baru, lalu spec dan rencana yang ditautkan di bawah.

## Status

| Bagian | Status |
| --- | --- |
| Rencana 1 Fondasi (`docs/superpowers/plans/2026-10-21-01-fondasi.md`) | ✅ merged ke `main` (PR #1) |
| Rencana 2a Buku kas (`…/2026-10-21-02a-buku-kas.md`) | ✅ merged ke `main` (PR #2) |
| Rencana 2b-1 Pagu (`…/2026-10-21-02b1-pagu.md`) | ✅ merged (PR #2). Bagian "surat penawaran" sudah dibuang di PR #3 |
| Pagu generik: jumlah hari per pagu, tanpa seed pagu | ✅ merged (PR #3; migrasi 0003 sudah di Neon) |
| Rencana 2b-2 Dompet & cek saldo (`…/2026-10-21-02b2-dompet.md`) | ✅ branch `feat/dompet` (juga: form proyek baru tanpa pax bawaan, 1 mobil). Menunggu PR/merge |
| Rencana 2b-3 Kategori, mobil, pengaturan & hapus proyek (`…/2026-10-21-02b3-pengaturan.md`) | ✅ merged (PR #5). Belum: sinkronisasi spec §3.2/§3.4/§4.4/§5 (Task 5 Step 3) |
| Rencana 3 Scan bon | ⏳ berikutnya. `GEMINI_API_KEY` & `BLOB_READ_WRITE_TOKEN` sudah ada di `.env.local`. Pengguna pilih Gemini + Blob. Sambungkan hapus foto Blob ke `deleteProject` |
| Rencana 3 Bon | ⏳ upload Vercel Blob + scan Gemini free tier (spec §6.1) |
| Rencana 4 Ekspor | ⏳ Google Sheets + Drive, pola OAuth mkk-dashboard (spec §6.2), PWA, deploy Vercel (`sin1`) |

**Langkah berikutnya:**

1. Sinkronkan spec dengan 2b-2/2b-3 (endpoint categories/vehicles/settings/DELETE project, aturan kategori sistem & mobil).
2. Tulis & eksekusi inline **Rencana 3: Scan bon** (spec §6.1) — hemat kuota: rencana ringkas, E2E via curl (bukan browser), verifikasi penuh sekali per task.
3. Pengguna mengisi "Jumlah hari" = 6 untuk Operasional Harian di proyek aslinya (data asli, jangan diubah tanpa izin).

## Dokumen kunci

- Spec: `docs/superpowers/specs/2026-10-21-udp-tracker-design.md` (sudah disinkronkan dengan semua keputusan)
- Kontrak folder/alur data: `docs/architecture/data-flow.md` (adaptasi dari `/Users/riski/Repo/srikandi-merdeka-cup/docs/architecture/data-flow.md`)
- Pola ekspor Google: `/Users/riski/Repo/dashboard` (`lib/connectors/google-oauth.ts`, `lib/reports/engine/sheets.ts`)

## Lingkungan

- Neon project `calm-lake-03611185`, branch `production`, region Singapura. Sudah di-link (`neon.ts`, `.neon/`). `.env.local` berisi `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`, `NEON_BRANCH`, `APP_PASSWORD_HASH`, `SESSION_SECRET` (dibuat pengguna). Migrasi: `npm run db:migrate` (0000–0002 sudah diterapkan).
- Pengguna menjalankan sendiri `npm run dev` di port **3051** (laptop: localhost:3051, HP: `http://<IP-laptop>:3051`). Jangan matikan proses itu.
- Data asli di Neon: 1 proyek "Q4 Hero & Editorial Feature Videos - Part 1".

## Fakta teknis yang sudah terbukti (hemat waktu, jangan ditemukan ulang)

- **Next.js 16.4**: `cacheComponents` aktif. Setiap section yang membaca DB/cookies memanggil `await connection()` di baris pertama. Kalau tidak, build gagal karena `env()` terbaca saat prerender. `usePathname`/`useSearchParams` di layout harus di dalam `<Suspense>` (lihat `AppShell` + `BottomNavLinks`). `middleware` → `src/proxy.ts`. `params` berupa Promise; pakai `RouteContext<"/api/…">` dan `PageProps<"/…">`.
- **Dev via IP**: `next.config.ts` mengisi `allowedDevOrigins` dengan IP LAN laptop. Tanpa itu halaman yang dibuka lewat IP tidak hydrate (tombol mati).
- **DB**: Drizzle + `pg` Pool + `attachDatabasePool` (rekomendasi skill Neon). Migrasi lewat `DATABASE_URL_UNPOOLED`. `withVerifiedSsl()` mengunci `sslmode=verify-full`. Test pakai PGlite (`tests/helpers/test-db.ts`). Fungsi server menerima `db: Db` sebagai parameter pertama.
- **UI**: komponen NeoBrutalism (ex-RetroUI, berbasis **Base UI**) disalin oleh `npm run ui:sync` ke `src/components/ui`, yang **tidak boleh diedit** (`npm run ui:check`). Jangan pakai `shadcn add`, karena CLI mengambil `button` dari registry default. Repo `Logging-Stuff/RetroUI` sudah di-repo-jack, jangan di-clone. `ToggleGroup` memakai `value` berupa array. `NativeSelect` butuh `NATIVE_SELECT_CLASS` (`src/components/app/form-classes.ts`). `DrawerContent className="mx-auto max-w-[480px]"`.
- **Next 16 menyimpan state halaman** (Cache Components menyembunyikan route dengan `<Activity>`, maks 3 route, per URL termasuk query): tutup drawer sebelum navigasi (lihat `DayDetailPanel onNavigate`); form "buat baru" pakai `useResetAfterSave` (`src/lib/use-reset-after-save.ts`) sebagai `key` agar kosong lagi setelah simpan, draf belum disimpan tetap ada. Dokumen: `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- Test komponen/hook React: file `*.test.tsx` dengan `// @vitest-environment happy-dom` (happy-dom dipin 20.14.5).
- **Chrome**: Enter setelah mengetik password kadang dimakan popup saran password bawaan. Ini bukan bug app.
- **Seluruh angka** (saldo, total, pagu) dihitung di `lib/` dari `getLedger()`, bukan dengan SUM di SQL.

## Cara kerja yang dipakai (ikuti lagi)

- Superpowers: brainstorming → spec → writing-plans → executing-plans (inline), TDD per task, commit per task dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Kerja di branch fitur, bukan `main`.
- Kode di dokumen rencana bisa disalin otomatis per task dengan skrip ekstraktor (cocokkan baris "`path`:" + blok kode). Skrip itu ada di scratchpad sesi lama, jadi buat ulang bila perlu.
- **Gerbang commit pakai exit code** (`npm run build > log; echo $?`), bukan `grep`. Di zsh, variabel berisi beberapa flag tidak dipecah: tulis skrip uji sebagai file bash.
- **E2E**: buat kredensial sementara (hash argon2 + secret acak di scratchpad, bukan `.env.local`), `next start -p 3100` dengan env proses, uji via curl. Untuk uji browser pakai **`127.0.0.1:3100`**, bukan `localhost`, karena cookie tidak dibedakan per port dan login uji akan menimpa sesi pengguna di localhost:3051. Hapus proyek "E2E %" dan `login_attempts` uji dari Neon setelahnya.
- Verifikasi penuh: `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`.
- E2E: hapus proyek uji dengan menghapus `transactions` proyek itu dulu (FK transaksi → dompet/kategori `RESTRICT`), baru `projects` (cascade sisanya). Login di browser uji: `form_input` tidak memicu state React; ketik manual.
- Halaman `notFound()` di dalam section ber-Suspense membalas HTTP 200 (streaming PPR) dengan isi 404 — perilaku Next, sama di `/transaksi/[id]`.

## Preferensi pengguna

- **Aplikasi generik/reusable:** jangan hardcode tarif, seed, atau tombol migrasi khusus satu kontrak. Kebutuhan dari proyek pengguna dibuat versi umum yang bisa diatur di UI (contoh: "operasional 6 hari" → isian jumlah hari per pagu).
- Bahasa Indonesia santai. Hanya layanan gratis (Gemini free tier, Neon/Vercel free).
- **Aksi yang menghapus wajib ada konfirmasi** (pengguna pernah kecewa dengan tombol tanpa konfirmasi).
- Kelebihan pagu = "ditanggung kantor".
