# UDP Tracker

Aplikasi mobile-first untuk mencatat dan mempertanggungjawabkan UDP produksi video (hero & editorial feature). Stack: Next.js 16, Neon + Drizzle, TanStack Query, Tailwind v4, NeoBrutalism (ex-RetroUI).

Spec: `docs/superpowers/specs/2026-10-21-udp-tracker-design.md` · Alur data: `docs/architecture/data-flow.md`

## Setup lokal

```bash
npm install
npm i -g neon@latest && neon login
neon env pull                  # tulis DATABASE_URL, DATABASE_URL_UNPOOLED, NEON_BRANCH ke .env.local
npm run hash-password          # tambahkan APP_PASSWORD_HASH + SESSION_SECRET ke .env.local
npm run db:migrate
npm run dev
```

Buka http://localhost:3051. Untuk mencoba di HP pada WiFi yang sama, buka `http://<IP-laptop>:3051`. `next.config.ts` otomatis mengizinkan IP LAN laptop (`allowedDevOrigins`). Tanpa itu, Next 16 menolak origin selain localhost dan halaman tidak hydrate (tombol tidak bereaksi).

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm test` | Vitest (unit + PGlite) |
| `npm run typecheck` | `next typegen` + `tsc` |
| `npm run lint` | ESLint |
| `npm run db:generate` | buat migrasi dari `src/db/schema.ts` |
| `npm run db:migrate` | jalankan migrasi ke `DATABASE_URL` |
| `npm run ui:sync` | salin/perbarui komponen NeoBrutalism ke `src/components/ui` |
| `npm run ui:check` | pastikan `src/components/ui` sama persis dengan registry |

## Komponen UI

`src/components/ui/*` disalin dari registry NeoBrutalism (`https://neobrutalism.com/r/{name}.json`, daftar di `ui.config.json`) dan **tidak boleh diedit**. Kustomisasi dilakukan di `src/components/app/*` atau lewat token di `src/app/globals.css`. Untuk menambah komponen, tambahkan namanya di `ui.config.json`, lalu jalankan `npm run ui:sync`. Jangan pakai `shadcn add` untuk komponen ini, karena CLI mengambil dependensi seperti `button` dari registry default shadcn.

> Repo `github.com/Logging-Stuff/RetroUI` (di-link template shadcn.io) sudah diambil alih pihak lain. Jangan di-clone. Sumber sah: `github.com/neobrutalism/neobrutalism`.

## SOP biaya admin

1. Satu bukti transfer = satu transaksi.
2. Nominal = jumlah yang diterima penerima, bukan total yang terpotong dari rekening.
3. Biaya admin diisi di kolom **Biaya admin** pada transaksi itu (Pengeluaran atau Transfer). Jangan digabung ke nominal, jangan dicatat sebagai transaksi terpisah.
4. Pakai Scan bon: fee terisi otomatis. Cek angkanya.

## Deploy (Vercel + Neon)

1. Push ke GitHub, lalu import ke Vercel.
2. Tambahkan `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (dari `neon env pull`), `APP_PASSWORD_HASH`, dan `SESSION_SECRET` di Environment Variables. Set Function Region ke Singapura (`sin1`), sama dengan region Neon.
3. Deploy. Script `vercel-build` menjalankan migrasi sebelum `next build`.
