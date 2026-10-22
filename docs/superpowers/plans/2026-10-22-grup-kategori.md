# Grup Kategori — Implementation Plan (ringkas)

> Dieksekusi langsung di sesi yang sama (superpowers:executing-plans). Versi ringkas atas persetujuan user: daftar tugas + file + tes, kode ditulis saat eksekusi. **Jangan commit/push.**

**Goal:** Grup kategori pengeluaran (wajib) yang mengikuti RAB, dipakai di halaman Kategori, form, filter, beranda, dan ekspor.

**Spec:** `docs/superpowers/specs/2026-10-22-grup-kategori-design.md`

---

1. **Skema + migrasi**
   - Files: `src/db/schema.ts`, `src/db/migrations/0006_*.sql` (drizzle-kit generate, lalu disunting: buat tabel → kolom → backfill per proyek → CHECK).
   - Tes: `tests/db-schema.test.ts` (tabel ada, CHECK menolak expense tanpa grup); tes migrasi backfill memakai PGlite (migrasi 0000–0005, seed data, lalu 0006).
2. **Tipe, mapper, ledger**
   - `CategoryGroup { id, name }`; `Category.groupId: string | null`; `Ledger.groups`.
   - Files: `budgets/types/*`, `budgets/mappers/*`, `budgets/api/category-groups-repo.ts`, `transactions/queries/ledger.ts`, `tests/helpers/ledger-fixture.ts`.
3. **Seed bawaan**
   - `buildProjectDefaults` mengembalikan `groups` dan setiap kategori pengeluaran `groupName`. `createProject` menyimpan grup dulu, lalu kategori.
   - Tes: `seed-defaults.test.ts`, tes create-project.
4. **Service & API**
   - Grup: tambah, ganti nama (nama unik), hapus (hanya kalau kosong).
   - Kategori: `groupId` wajib untuk expense, null untuk income, harus milik proyek.
   - Routes: `/api/projects/[projectId]/category-groups` (POST) dan `/[groupId]` (PATCH, DELETE). Hooks di `use-categories.ts`.
   - Tes: `budgets/categories.test.ts`.
5. **Urutan dan pengelompokan (lib murni)**
   - `groupCategories(groups, categories)` → `{ group, categories }[]` dengan urutan grup A–Z (Lain-lain terakhir) dan kategori `sortCategoriesForPicker`.
   - Tes unit.
6. **UI kelola** (halaman Kategori: grup + form kategori pilih grup + dialog hapus grup)
7. **UI pakai**
   - Chip kategori di form transaksi dan form pagu dikelompokkan per grup.
   - Filter kategori di /transaksi pakai opsi bergrup (`AppSelect` mendukung grup).
8. **Beranda:** `groupShares` menggantikan `categoryShares`; kartu "Pengeluaran per grup". Tes unit.
9. **Ekspor:** Rekap per grup, kolom Grup di Detail, kolom Harian diurutkan per grup. Tes `report.test.ts`.
10. **Verifikasi:** `npm test`, tsc, eslint, `ui:check`, `npm run db:migrate` ke DB dev (proyek nyata), lalu user cek di dev server.
