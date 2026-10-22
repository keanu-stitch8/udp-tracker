# Grup kategori — desain

Tanggal: 2026-10-22. Melengkapi spec utama §3 (model kategori), spec beranda (`2026-10-22-beranda-design.md`), dan spec ekspor.

## Tujuan

Kategori pengeluaran dikelompokkan ke **grup** yang mengikuti judul RAB (Akomodasi, Meal, Transportation, Operasional). Realisasi per grup bisa dicocokkan langsung dengan RAB saat menyusun penawaran final ke client.

Istilah: **Grup kategori → Kategori** (gaya YNAB/Monarch). Grup hanya wadah; transaksi selalu dicatat ke kategori. Satu tingkat saja.

## Aturan data

- Tabel baru `category_groups`: `id`, `project_id` (cascade), `name`, `sort_order`, timestamps. Index per proyek.
- `categories.group_id` uuid, FK ke `category_groups` (`on delete restrict`).
  - **Wajib untuk kategori pengeluaran, kosong untuk pemasukan.** Constraint DB: `CHECK ((kind = 'expense') = (group_id IS NOT NULL))`.
  - Grup dan kategorinya harus satu proyek (dicek di service).
- Nama grup unik per proyek, tanpa beda huruf besar/kecil (dicek di service).
- **Urutan tampil grup:** A–Z, "Lain-lain"/"Lainnya" selalu di akhir. Aturan sama dengan `sortCategoriesForPicker`, tanpa pengaturan urutan manual.
- **Hapus grup** selalu bisa, dengan konfirmasi. Grup kosong langsung dihapus. Grup berisi kategori (termasuk yang diarsip) wajib memilih grup tujuan: semua kategorinya dipindah ke sana lalu grup dihapus, dalam satu transaksi DB.

## Bawaan proyek baru (`buildProjectDefaults`)

| Grup | Kategori |
|---|---|
| Akomodasi | Sarapan |
| Meal | Makan Siang, Makan Malam |
| Operasional | Bensin Harian (kendaraan), Parkir Harian (kendaraan), Snack & Air Minum |
| Transportation | BBM Perjalanan (kendaraan), Tol (kendaraan), Parkir Perjalanan (kendaraan) |
| Lain-lain | Biaya Admin (admin), Lain-lain |

Pemasukan tetap: UDP Kantor, Lainnya (tanpa grup).

Satu bon minimarket (snack + air mineral) dicatat sebagai **satu** transaksi "Snack & Air Minum" (grup Operasional), tidak dipecah per item.

## Migrasi proyek lama

Untuk setiap proyek yang sudah ada:

1. Buat 5 grup bawaan.
2. Isi grup kategori pengeluaran berdasarkan nama persis:
   - Sarapan → Akomodasi
   - Makan Siang, Makan Malam → Meal
   - Bensin Harian, Snack & Air Minum, Parkir, Parkir Harian → Operasional. "Parkir" lama tetap bernama Parkir.
   - BBM Perjalanan, Tol, Parkir Perjalanan → Transportation
   - Selain itu, termasuk Biaya Admin, Lain-lain, dan kategori buatan sendiri → Lain-lain
3. Tambahkan constraint CHECK setelah semua terisi.

## Tampilan

### Halaman Kategori (`/lainnya/kategori`)

- Bagian pengeluaran dikelompokkan per grup: judul grup, lalu daftar kategorinya.
- Tombol tambah grup. Grup bisa diganti nama dan dihapus. Kalau grup masih berisi, konfirmasi hapus meminta grup tujuan untuk kategorinya.
- Form kategori pengeluaran punya pilihan **Grup** (`AppSelect`), wajib diisi. Saat menambah kategori dari dalam suatu grup, grup itu jadi nilai awal.

### Form transaksi dan form pagu

Chip kategori pengeluaran dikelompokkan dengan judul grup kecil (`LABEL`). Urutan di dalam grup tetap `sortCategoriesForPicker`.

### Filter Kategori di /transaksi

Opsi dikelompokkan per grup (Base UI `SelectGroup` + `SelectLabel`). Kategori pemasukan ada di grup "Pemasukan" di akhir.

### Beranda

Kartu "Pengeluaran per kategori" berubah jadi **"Pengeluaran per grup"**:

- Tiap grup menampilkan nama, total, persen dari total pengeluaran, dan bar.
- Di bawahnya tampil semua kategori di grup itu yang ada pengeluarannya, dengan nominal dan persen (teks kecil, tanpa bar).
- Grup diurutkan dari total terbesar, kategori di dalam grup juga dari terbesar.
- Entri tanpa kategori masuk grup semu "Tanpa kategori".

### Ekspor

- **Rekap:** bagian "Pengeluaran per kategori" diganti "Pengeluaran per grup". Baris grup ditebalkan dengan subtotal, lalu baris kategori dengan nama diawali dua spasi. Urutan grup mengikuti urutan tampil.
- **Detail:** kolom **Grup** ditambahkan sebelum Kategori (transfer/pemasukan: "-").
- **Harian:** kolom kategori diurutkan per grup (urutan tampil grup, lalu urutan kategori).

## Di luar cakupan

Grup bertingkat, grup untuk pemasukan, filter /transaksi per grup, urutan grup manual, pagu per grup.

## Pengujian

- **Unit test:** seed bawaan, urutan grup, pengelompokan beranda per grup, isi Rekap/Detail/Harian.
- **Tes integrasi:**
  - service grup: tambah, ganti nama, nama dobel ditolak, hapus grup berisi tanpa tujuan ditolak, hapus dengan pindah kategori;
  - kategori pengeluaran tanpa grup ditolak;
  - migrasi pada proyek yang sudah berisi data.
- Typecheck, lint, `ui:check`, dan cek dev server sekali.
