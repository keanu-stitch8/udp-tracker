# Handoff — UDP Tracker (per 2026-10-21)

Baca ini dulu di chat baru, lalu spec dan rencana yang ditautkan di bawah.

## Status

| Bagian | Status |
| --- | --- |
| Rencana 1 Fondasi (`docs/superpowers/plans/2026-10-21-01-fondasi.md`) | ✅ merged ke `main` (PR #1) |
| Rencana 2a Buku kas (`…/2026-10-21-02a-buku-kas.md`) | ✅ di branch `feat/buku-kas`, **PR #2** https://github.com/keanu-stitch8/udp-tracker/pull/2 (menunggu merge) |
| Rencana 2b-1 Pagu surat penawaran (`…/2026-10-21-02b1-pagu.md`) | ✅ selesai di branch yang sama |
| Rencana 2b sisa | ⏳ belum: kelola dompet + **cek saldo Flazz/cash + catat selisih** (spec §3.3), kelola kategori & mobil, pengaturan proyek (ubah nama/tanggal/pax, Selesai/Buka lagi), hapus proyek |
| Rencana 3 Bon | ⏳ upload Vercel Blob + scan Gemini free tier (spec §6.1) |
| Rencana 4 Ekspor | ⏳ Google Sheets + Drive, pola OAuth mkk-dashboard (spec §6.2), PWA, deploy Vercel (`sin1`) |

**Langkah berikutnya yang menunggu pengguna:**

1. Review & merge **PR #2** (`feat/buku-kas` → `main`). Setelah merge: `git checkout main && git pull`, hapus branch lokal.
2. Pengguna perlu klik **Lainnya → Pagu → "Terapkan pagu surat penawaran"** di proyek aslinya ("Q4 Hero & Editorial Feature Videos - Part 1"), supaya BBM → BBM Perjalanan, ditambah Bensin Harian, dan 3 pagu baru. Jangan dijalankan tanpa izin, karena ini data asli.

Setelah itu, tulis Rencana 2b sisa (skill `superpowers:writing-plans`) dan eksekusi inline (pilihan pengguna: inline, bukan subagent).

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
- **Next 16 menyimpan state halaman** saat back/push: tutup drawer sebelum navigasi (lihat `DayDetailPanel onNavigate`).
- **Chrome**: Enter setelah mengetik password kadang dimakan popup saran password bawaan. Ini bukan bug app.
- **Seluruh angka** (saldo, total, pagu) dihitung di `lib/` dari `getLedger()`, bukan dengan SUM di SQL.

## Cara kerja yang dipakai (ikuti lagi)

- Superpowers: brainstorming → spec → writing-plans → executing-plans (inline), TDD per task, commit per task dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Kerja di branch fitur, bukan `main`.
- Kode di dokumen rencana bisa disalin otomatis per task dengan skrip ekstraktor (cocokkan baris "`path`:" + blok kode). Skrip itu ada di scratchpad sesi lama, jadi buat ulang bila perlu.
- **Gerbang commit pakai exit code** (`npm run build > log; echo $?`), bukan `grep`. Di zsh, variabel berisi beberapa flag tidak dipecah: tulis skrip uji sebagai file bash.
- **E2E**: buat kredensial sementara (hash argon2 + secret acak di scratchpad, bukan `.env.local`), `next start -p 3100` dengan env proses, uji via curl. Untuk uji browser pakai **`127.0.0.1:3100`**, bukan `localhost`, karena cookie tidak dibedakan per port dan login uji akan menimpa sesi pengguna di localhost:3051. Hapus proyek "E2E %" dan `login_attempts` uji dari Neon setelahnya.
- Verifikasi penuh: `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`.

## Preferensi pengguna

- Bahasa Indonesia santai. Hanya layanan gratis (Gemini free tier, Neon/Vercel free).
- **Aksi yang menghapus wajib ada konfirmasi** (pengguna pernah kecewa dengan tombol tanpa konfirmasi).
- Pagu dari surat penawaran: Makan 150rb/orang/hari (siang + malam), Sarapan 25rb/orang/hari, BBM + Tol 1,3jt/mobil/trip, Operasional harian 100rb/hari/mobil. Kelebihan = "ditanggung kantor".
