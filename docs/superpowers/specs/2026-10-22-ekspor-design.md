# Ekspor Google Sheets + Drive & PWA — addendum desain

Tanggal: 2026-10-22. Melengkapi spec utama §6.2 (ekspor) dan §10 (PWA). Deploy Vercel dikerjakan terpisah, paling akhir.

## Perubahan terhadap §6.2

- **Tab Detail** punya kolom **Jam** di sebelah Tanggal. Baris urut kronologis (lama → baru), jadi saldo berjalan terbaca dari atas.
- **Tab Pagu** memakai "Lebih pagu" (netral), bukan "ditanggung kantor".
- **Link bon** ditulis sebagai sel teks berlink (`textFormat.link`), bukan rumus `HYPERLINK`, supaya tidak bergantung pada pemisah argumen locale `in_ID`.
- **Putuskan akun Google** hanya menghapus token dari DB, **tanpa mencabut di Google**. OAuth client dipakai bersama mkk-dashboard, dan pencabutan di Google mematikan semua izin client itu untuk akun yang sama.
- **Hubungkan Google** hanya bisa dari `localhost` atau domain `https`, karena Google menolak redirect ke IP LAN. Token di DB dipakai bersama, jadi ekspor tetap bisa dijalankan dari HP.

## Komponen

| Bagian | Isi |
| --- | --- |
| `src/lib/crypto.ts` | AES-256-GCM (`ENCRYPTION_KEY`, 32 byte base64/hex), diadaptasi dari dashboard |
| `src/modules/google/` | env OAuth, repo `google_credentials`, `authUrl`/`completeOAuth`/`authorizedClient`/`disconnectGoogle`, `gcall` (retry 2–32 detik), `googleErrorMessage` (Bahasa Indonesia) |
| Route | `GET /api/auth/google/start` (cookie `state` httpOnly 10 menit), `GET /api/auth/google/callback` (cek `state`, simpan token, redirect ke `/lainnya/ekspor?google=ok\|error`), `GET/DELETE /api/google` (status / putuskan) |
| `src/modules/exports/lib/` | fungsi murni: `buildReport(ledger, exportedAt)` → 4 tab (`ReportTab`), `receiptFileName()` |
| `src/modules/exports/api/google-gateway.ts` | adapter googleapis: folder, upload file, buat spreadsheet + tulis tab (`updateCells`), rename |
| `src/modules/exports/commands/export-report.ts` | alur §6.2 memakai gateway yang bisa di-mock |
| Route | `POST /api/projects/[projectId]/export` (`maxDuration = 300`) |
| UI | Lainnya → **Ekspor laporan** (`/lainnya/ekspor`, sub-halaman dengan header ←): status akun, tombol Ekspor, link Sheet + folder terakhir, Putuskan (konfirmasi) |
| PWA | `src/app/manifest.ts` + ikon PNG dari `next/og` di `/icons/…` (path sudah dikecualikan di `proxy.ts`) |

## Bentuk data laporan

```ts
type ReportCell = { value: string | number | null; bold?: boolean; money?: boolean; link?: string };
interface ReportTab { title: string; rows: ReportCell[][]; freezeRows: number; columnWidths?: number[] }
```

Gateway menerjemahkan `money` menjadi format angka `#,##0` dan `bold` menjadi teks tebal. Tes `lib/` memeriksa isi baris tanpa Google.

## Tes

- `buildReport`: urutan Detail + saldo berjalan (termasuk transfer + admin), kolom Jam, link bon, Harian per kategori, Pagu (lebih pagu), Rekap (Sisa/Kurang).
- `receiptFileName`: `2026-10-20_001_Makan Siang_600000.jpg`, karakter `/` di nama kategori dibuang.
- `crypto`: enkripsi bolak-balik, kunci salah ditolak.
- `exportReport` (PGlite + gateway palsu): folder dibuat sekali, foto tidak diunggah dua kali, sheet lama di-rename `(lama …)`, `sheetId`/`sheetUrl` tersimpan, gagal di tengah → `(GAGAL …)`.
- Route: 401 tanpa sesi (sudah dijamin `route()`).
