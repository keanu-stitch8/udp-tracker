# Biaya admin konsisten — desain

Tanggal: 2026-10-22. Melengkapi spec utama §3 (model), §3.3 (perhitungan), §5 (form), §6.1 (scan), §6.2 (ekspor).

## Masalah

1. **Pengeluaran tidak punya biaya admin.** Refund/reimburse lewat transfer bank atau QRIS (mis. "refund laundry" 16.500 + fee 2.000) tercatat sebagai satu pengeluaran 18.500, sehingga fee masuk ke kategori yang salah.
2. **Biaya admin transfer tidak terlihat.** Nilainya sudah dihitung ke kategori Biaya Admin (total, kalender, pagu, ekspor), tetapi di daftar Kategori tertulis "0 transaksi" dan filter Transaksi → Biaya Admin kosong.
3. **Dua cara mencatat.** Kategori Biaya Admin bisa dipilih manual di form Pengeluaran, padahal transfer mencatatnya otomatis.
4. **Besar fee berbeda-beda:** BI FAST 2.500, QRIS 2.000, antarbank online 6.500.

## SOP (dicatat di README)

1. Satu bukti transfer = satu transaksi.
2. Nominal = jumlah yang diterima penerima, bukan total yang terpotong dari rekening.
3. Biaya admin diisi di kolom **Biaya admin** pada transaksi itu (Pengeluaran atau Transfer). Jangan digabung ke nominal, jangan dicatat sebagai transaksi terpisah.
4. Pakai Scan bon: fee terisi otomatis. Cek angkanya.

## Aturan data

- `transactions.admin_fee` (sudah ada) berlaku untuk **expense** dan **transfer**. Untuk income selalu 0 (service menolak > 0).
- **Expense dengan biaya admin:** saldo dompet berkurang `amount + adminFee`. `amount` masuk ke kategorinya, `adminFee` masuk ke kategori Biaya Admin (`expenseEntries` menghasilkan dua entri, sama seperti transfer).
- **Kategori Biaya Admin otomatis:**
  - tidak muncul di pilihan kategori form, kecuali transaksi lama yang sedang diubah memang memakainya;
  - service menolak **membuat** pengeluaran baru berkategori Biaya Admin, dengan pesan "Isi di kolom Biaya admin pada transaksi yang terkena biaya.";
  - tidak ada migrasi data. Transaksi lama yang menggabungkan fee dikoreksi pengguna sendiri.
- **"Transaksi Biaya Admin"** = semua transaksi dengan `adminFee > 0`, ditambah pengeluaran lama yang berkategori Biaya Admin. Dipakai di:
  - jumlah transaksi pada daftar Kategori;
  - filter Transaksi → Kategori: Biaya Admin.

## UI

- **Form Pengeluaran:** tombol **"+ Biaya admin"** di bawah Dompet. Tombol ini membuka field yang sama dengan Transfer (preset 2.500 / 2.000 / 6.500 + input nominal). Field otomatis terbuka bila nilainya > 0, termasuk dari scan atau data tersimpan. Pemasukan tidak punya field ini.
- **Form Transfer:** tetap seperti sekarang, preset ditambah 2.000.
- **Baris riwayat:** "admin Rp X" tampil untuk expense maupun transfer. Subtotal harian ikut menghitung admin expense.
- Kalender, beranda, pagu, dan saldo dompet mengikuti otomatis lewat `expenseEntries` / `walletBalances`.

## Scan

- Fee dibaca **sesuai angka yang tertulis**, termasuk "Fee: Rp2.000,00" pada QRIS.
- Aturan BI FAST = 2.500 hanya dipakai bila bukti menyebut BI FAST tetapi angka biayanya tidak tertulis.
- Nominal = jumlah transfer, bukan "Total Transfer".

## Ekspor (tab Detail)

- Kolom baru **Biaya admin** setelah Keluar.
- Keluar = nominal expense (transfer: kosong). Saldo berjalan dikurangi Keluar + Biaya admin.
- Rekap dan Harian sudah memakai `expenseEntries`, jadi tidak berubah.

## Tes

- `expenseEntries`: expense + admin → dua entri. `ledgerTotals` / `walletBalances` ikut.
- `planTransaction`: admin pada income ditolak; expense baru berkategori Biaya Admin ditolak; update transaksi lama berkategori Biaya Admin tetap boleh.
- Filter Biaya Admin dan jumlah transaksi kategori ikut menghitung `adminFee > 0`.
- `groupByDate`: subtotal mencakup admin expense.
- Laporan Detail: kolom Biaya admin + saldo berjalan.
- Mapper/prompt scan: "Fee: Rp2.000,00" → 2000; "Total Transfer" bukan nominal.
