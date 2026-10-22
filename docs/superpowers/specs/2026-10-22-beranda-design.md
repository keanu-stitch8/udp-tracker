# Beranda baru — desain

Tanggal: 2026-10-22. Mengganti isi beranda (`/`, modul `dashboard`) dari spec utama.

## Tujuan

- Pagu adalah rahasia management: **tidak tampil di beranda** dan tidak ikut dikirim ke browser oleh endpoint beranda. Halaman Pagu tetap ada.
- Beranda menjawab pertanyaan harian di lapangan: sisa uang, pengeluaran hari ini, apa yang belum beres, saldo dompet, transaksi terakhir.
- Tampilan lebih hidup, mengikuti gaya kartu angka Brutadmin (neobrutalism.com): kotak ikon berwarna di pojok kanan atas.

## Urutan isi (layout HP)

1. **Progres proyek**: satu baris teks di atas kartu.
   - Sebelum `startDate`: "Mulai N hari lagi".
   - Selama proyek: "Hari ke-N dari M" (M = `project.days`).
   - Setelah `endDate`: "Selesai · M hari".
2. **Kartu Sisa/Kurang** (kuning, `bg-primary`), sama seperti sekarang.
3. **Empat kartu angka** (grid 2×2), masing-masing dengan kotak ikon pojok:

   | Kartu | Nilai | Warna kotak | Ikon (lucide) |
   |---|---|---|---|
   | UDP diterima | `totals.udpReceived` | `accent` (#fae583) | `Landmark` |
   | Pengeluaran | `totals.totalExpense` | `tile-pink` (#ffd2d2), token baru | `Receipt` |
   | Hari ini | jumlah `expenseEntries` bertanggal `todayWib()` | `tile-green` (#c4ff83), token baru | `CalendarDays` |
   | Rata-rata/hari | `totalExpense / hariBerjalan` | `chart-1` (#c4a1ff) | `TrendingUp` |

   - `hariBerjalan` = `daysInclusive(startDate, min(today, endDate))`, minimal 1.
   - Sebelum proyek mulai, "Rata-rata/hari" menampilkan "—".
4. **Perlu ditindaklanjuti**: kartu berisi daftar baris yang bisa diklik. Urutan item seperti di bawah.

   | Item | Kondisi | Teks | Tujuan klik |
   |---|---|---|---|
   | Tanpa bon | ada transaksi `expense` tanpa lampiran, bukan penyesuaian cek saldo (`balanceCheckId` null), bukan kategori Biaya Admin | "N pengeluaran belum ada bon" | `/transaksi?bon=belum` |
   | Selisih cek saldo | cek saldo **terbaru** dompet aktif punya `difference ≠ 0` dan `adjustmentId` null | "Dompet X: selisih ±Rp … belum dicatat" | `/lainnya/dompet/{id}` |
   | Dompet minus | dompet aktif non-reimburse dengan saldo < 0 | "Dompet X minus Rp …" | `/lainnya/dompet/{id}` |
   | Reimburse belum beres | dompet aktif reimburse dengan saldo ≠ 0 | "X: " + `reimburseStatus(balance)` | `/lainnya/dompet/{id}` |

   Kalau tidak ada item, kartu tidak tampil sama sekali.
5. **Saldo dompet**: tetap seperti sekarang.
6. **Transaksi terakhir**: tetap seperti sekarang (5 transaksi dan tombol "Lihat semua").
7. **Pengeluaran per kategori**:
   - Data: `expenseEntries` dijumlah per kategori, diurutkan dari nominal terbesar.
   - Tampil **semua** kategori yang ada pengeluarannya, tidak digabung jadi "Lainnya". Entri tanpa kategori masuk "Tanpa kategori".
   - Tiap baris berisi ikon kategori, nama, nominal, persen dari `totalExpense`, dan bar.
   - Bar memakai komponen `Progress` (value = persen) dengan warna indikator bergilir: `chart-1`, `chart-2`, `chart-3`, `chart-5`, `accent`. Warna diatur dari luar lewat selector `[data-slot=progress-indicator]`.
   - Kalau belum ada pengeluaran, kartu ini tidak tampil.

## Filter "Tanpa bon" di /transaksi (istilah app: "bon", sama dengan penanda "tanpa bon" di baris transaksi)

- `TransactionFilters` mendapat field `receipt: "all" | "missing"`.
- Arti `missing` sama dengan item "Tanpa bon" di atas. Logikanya satu fungsi bersama di `transactions/lib`, dipakai beranda dan filter.
- `/transaksi?bon=belum` menjadi nilai awal filter `receipt: "missing"`.
- Di daftar transaksi muncul chip "Tanpa bon ×" selama filter aktif. Klik chip mematikan filter.
- Tidak ada kontrol baru lain di bar filter; filter ini hanya dibuka dari beranda.

## Data (server)

`getDashboardSummary` mengembalikan:

```ts
interface DashboardSummary {
  totals: LedgerTotals;
  progress: ProjectProgress;          // { phase: "before" | "during" | "after"; day: number; totalDays: number; daysUntil: number }
  todayExpense: number;
  dailyAverage: number | null;        // null sebelum proyek mulai
  attention: AttentionItem[];         // { kind, label, href }
  categories: CategoryShare[];        // { key, name, icon, amount, share }
  wallets: WalletBalance[];
  recent: TransactionView[];
}
```

- `budgets` dan `budgetTotal` **dihapus** dari tipe dan query.
- Cek saldo terbaru per dompet diambil dengan satu query repo baru di `wallets/api/balance-checks-repo.ts`.
- Semua perhitungan berupa fungsi murni di `dashboard/lib/` (`progress.ts`, `attention.ts`, `category-share.ts`). Masing-masing punya unit test.

## Komponen

Semua di `src/modules/dashboard/components/`. `dashboard-summary.tsx` hanya merangkai komponen berikut:

- `stat-tile.tsx`: Card dengan label, nominal, dan kotak ikon pojok (`absolute right-0 top-0 size-12 border-b-2 border-l-2`, warna lewat prop).
- `attention-card.tsx`
- `category-breakdown.tsx`

Token baru di `globals.css` (`:root` dan `@theme inline`): `--tile-green: #c4ff83` dan `--tile-pink: #ffd2d2`. Komponen di `src/components/ui` tidak diedit.

## Di luar cakupan

Grafik tren harian, perbandingan dengan periode sebelumnya, pengaturan urutan kartu, link dari kategori ke daftar transaksi.

## Pengujian

- Unit test untuk `progress`, `attention`, `category-share`, dan filter `receipt`.
- Typecheck, lint, `ui:check`.
- Cek beranda sekali di dev server.
