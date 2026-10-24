# Impor riwayat tol dari screenshot e-toll — desain

Disetujui pengguna 2026-10-23.

## Tujuan

Screenshot riwayat kartu e-toll (Flazz BCA, layar "Transaksi Sale", dsb.) berisi banyak tap tol. Pengguna ingin semua tap itu tercatat sekali jalan, bukan diketik satu per satu.

## Keputusan

- **Satu transaksi per tap**: tanggal & jam persis seperti di kartu (kalender harian dan saldo dompet e-toll cocok dengan kartu).
- **Hanya pengeluaran tol.** Top Up dan baris lain dibuang: isi saldo sudah dicatat pengguna sebagai transfer.
- **Otomatis lewat scan biasa** di form Catat transaksi: tidak ada tombol/halaman terpisah. Gemini menjawab sekaligus apakah gambar = bon biasa atau riwayat e-toll (tetap satu panggilan).
- **Mobil dipilih pengguna** (screenshot tidak andal menunjukkan kartu/mobil). Bila mobil/dompet e-toll sudah dipilih sebelum scan, langsung terpakai.
- **Duplikat**: tap yang sudah ada di dompet yang sama dengan tanggal + jam + nominal sama → tidak dicentang, label "Sudah tercatat"; tetap bisa dicentang.

## 1. Scan

- `receiptPrompt` + schema ditambah `kind: "receipt" | "toll_history"` dan `tolls: [{ date, time, amount }]` (hanya pengeluaran tol, urut seperti di gambar). Field bon lama tetap.
- `ReceiptScan` ditambah `kind` dan `tolls: TollTap[]` (`{ date, time, amount }`, semua wajib). Mapper membuang baris yang tanggal/jam/nominalnya tidak valid (aturan sama dengan bon: tanggal ±1 tahun proyek, jam 24 jam tanpa detik, nominal bulat > 0). `kind = "toll_history"` hanya bila minimal satu tap valid; selain itu `"receipt"`.

## 2. Form: panel "Riwayat tol"

Muncul menggantikan isian transaksi bila scan menghasilkan `toll_history` di form **baru** (bukan form Ubah).

- Kategori: kategori pengeluaran bernama "Tol" (tidak peka huruf besar); bila tidak ada, pengguna memilih kategori pengeluaran (kasus jarang).
- Mobil (Toggle seperti sekarang) → dompet e-toll mobil itu; dompet bisa diganti (pilihan dompet sumber seperti sekarang). Mobil wajib bila kategori terkait kendaraan.
- Daftar tap: tanggal · jam · nominal + checkbox (Toggle). Duplikat: tidak dicentang + label "Sudah tercatat" (dihitung di browser dari daftar transaksi dompet terpilih; dihitung ulang saat dompet diganti).
- Ringkasan "N tap · Rp total", tombol **Simpan N transaksi** dan **Batal, isi manual** (kembali ke form biasa, screenshot tetap terlampir).
- Merchant tiap transaksi: "Tol". Lampiran: screenshot yang sama di setiap transaksi.
- Setelah simpan: toast "N transaksi tol disimpan", kembali seperti simpan biasa.

## 3. Server

- `POST /api/projects/[projectId]/transactions/batch`, `projectRoute("transact")`, body `{ transactions: TransactionInput[] }`, 1–50 item. Setiap item divalidasi `planTransaction` + cakupan dompet seperti `createTransaction`; semua dalam satu transaksi DB (semua atau tidak sama sekali). Error validasi menyebut nomor baris.
- **Blob bersama**: satu file bisa ditautkan ke banyak baris `attachments`. Saat lampiran dilepas dari satu transaksi, file Blob hanya dihapus bila tidak ada baris `attachments` lain dengan `blob_pathname` yang sama.
- **Ekspor Drive**: file dengan `blob_pathname` sama diunggah sekali; semua transaksinya memakai link Drive yang sama.
- Tanpa migrasi.

## Pengujian

- Mapper: `toll_history` dengan tap valid; baris rusak dibuang; tanpa tap valid → `receipt`.
- Duplikat (fungsi murni di `lib/`).
- Batch: tersimpan semua; satu baris salah → tidak ada yang tersimpan; anggota ke dompet di luar pegangan → ditolak.
- Blob bersama tidak terhapus selama masih dipakai.
- Ekspor: satu file untuk banyak transaksi diunggah sekali.
