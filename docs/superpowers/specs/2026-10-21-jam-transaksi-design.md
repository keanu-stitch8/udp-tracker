# Jam transaksi (WIB) — desain

Tanggal: 2026-10-21. Tambahan untuk spec utama `2026-10-21-udp-tracker-design.md` (§3 skema, §5 form, §6.1 scan bon).

## Tujuan

Setiap transaksi punya jam (`HH:mm`, 24 jam, WIB) selain tanggal. Jam diisi di form dan dibaca dari foto/PDF bon, struk, atau kwitansi. Jam tampil di riwayat transaksi dan menentukan urutan transaksi dalam satu hari.

## Keputusan

- **Jam wajib.** Tidak ada transaksi tanpa jam.
- **Disimpan sebagai kolom `time` terpisah**, di sebelah `date`, bukan mengganti `date` dengan `timestamptz`. Ledger, kalender, pagu, dan cek saldo tetap dihitung per tanggal dan tidak berubah.
- **Semua jam = WIB** (`Asia/Jakarta`), sama dengan aturan tanggal. Jam di form dan di riwayat tidak dikonversi ke zona waktu HP. Label "WIB" tidak ditampilkan di UI (keputusan pengguna).
- **Transaksi lama** diisi dari `created_at` yang dikonversi ke WIB (waktu input di aplikasi). Pengguna bisa mengoreksinya lewat ubah transaksi.

## Data

- Kolom baru `transactions.time`: Postgres `time(0)`, `NOT NULL`. Drizzle `time({ precision: 0 })` mengembalikan `"HH:mm:ss"`. Mapper memotongnya jadi `"HH:mm"`.
- Migrasi `0004` (dibuat drizzle-kit, lalu ditambah SQL backfill):
  1. tambah kolom `time` nullable;
  2. `UPDATE transactions SET time = date_trunc('minute', created_at AT TIME ZONE 'Asia/Jakarta')::time;`
  3. `ALTER COLUMN time SET NOT NULL`.
- `Transaction` (dan `TransactionView`) mendapat `time: string` (`"HH:mm"`).
- Urutan `selectTransactions`: `date desc, time desc, created_at desc`. Semua daftar (riwayat, detail hari di kalender, riwayat dompet) mengikuti urutan ini.

## Validasi dan helper

- `src/modules/shared/lib/date.ts`:
  - `nowTimeWib(now?)`: jam sekarang di WIB, `"HH:mm"`.
  - `isTime(value)`: `HH:mm` dengan jam 00–23 dan menit 00–59.
  - `timeSchema`: zod, pesan "Jam tidak valid." dan "Jam wajib diisi." untuk string kosong.
- `transactionInputSchema` mendapat `time: timeSchema` (wajib).

## Form transaksi

- Field **"Jam"** di samping Tanggal (grid 2 kolom). **Selalu format 24 jam** (`14:30`, bukan `2:30 PM`), di semua HP.
- Tidak memakai `<input type="time">` bawaan, karena tampilannya mengikuti setelan HP/browser (bisa AM/PM) dan tidak bisa dipaksa dari kode.
- Komponen baru `src/components/app/time-input.tsx` (`TimeInput`): `Input` teks dengan `inputMode="numeric"`, placeholder `14:30`, maks 5 karakter.
  - Saat mengetik, hanya angka yang diterima dan titik dua disisipkan otomatis (`1430` → `14:30`).
  - Saat blur, nilai dinormalkan (`930` → `09:30`, `9.30` → `09:30`). Nilai yang tidak valid dibiarkan apa adanya, lalu validasi menampilkan "Jam tidak valid.".
  - Logika format dipisah ke fungsi murni (`formatTimeTyping`, `normalizeTime` di `date.ts`) supaya bisa dites tanpa DOM.
- Transaksi baru: default jam sekarang di WIB, dihitung di server bersama `defaultDate` (prop `defaultTime`).
- Ubah transaksi: jam tersimpan dipakai.
- Badge "cek lagi" berlaku untuk jam yang diisi dari scan, sama seperti field scan lainnya.

## Scan bon, struk, dan kwitansi

- Prompt Gemini menambah field `time`: jam transaksi dalam format 24 jam `HH:mm`, dibaca dari bon/struk/kwitansi. Contoh variasi tulisan: `14:30`, `14.30`, `2:30 PM` → `14:30`. Isi null bila tidak ada atau ragu. Kwitansi tulisan tangan sering tanpa jam, dan itu wajar null.
- Schema respons menambah `time: STRING nullable`. `ReceiptScan` mendapat `time: string | null`, dan mapper `toTime()` menormalkan `H:mm`/`HH.mm` ke `HH:mm`. Nilai yang tidak valid menjadi null.
- Skema zod `ocrJson` menerima `time` yang tidak ada (`nullish`), karena hasil scan lama tersimpan tanpa `time`.
- Di form: jam dari scan mengisi field Jam hanya bila transaksi baru dan pengguna belum mengubah jam (aturan yang sama dengan tanggal). Bila scan tidak menemukan jam, field tetap berisi jam sekarang.

## Penyesuaian dari cek saldo

`adjustmentInput()` memberi jam `23:59`, karena transaksi penyesuaian mewakili saldo pada akhir hari cek saldo.

## Riwayat

- `TransactionRow`: jam tampil di awal baris detail kecil, misalnya `14:30 · Indomaret · Rekening`.
- Berlaku di riwayat transaksi, detail hari (kalender), dan riwayat dompet, karena semuanya memakai `TransactionRow`.

## Ekspor (Rencana 4)

Sheet transaksi nanti menyertakan kolom Jam di sebelah Tanggal.

## Tes

- `date.ts`: `nowTimeWib` (termasuk saat tanggal UTC berbeda dengan WIB; hasil selalu 24 jam), `isTime`, `timeSchema`, `formatTimeTyping`, `normalizeTime`.
- `transactionInputSchema`: jam wajib, format salah ditolak.
- `receipt-scan` mapper: `14.30` → `14:30`, `9:05` → `09:05`, `25:00`/teks acak → null.
- `adjustmentInput`: jam `23:59`.
- Repo (PGlite): urutan `date desc, time desc` dalam satu tanggal.
- Migrasi backfill: ekspresi SQL diuji di PGlite (`'2026-10-21T02:15:40Z'` → `09:15:00`). Setelah `db:migrate` di Neon, cocokkan beberapa baris (`created_at` vs `time`) lewat query.
- Fixture tes transaksi yang ada ditambah `time`.
