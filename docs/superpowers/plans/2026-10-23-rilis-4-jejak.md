# Rilis 4: Jejak penginput — rencana

Spec: `docs/superpowers/specs/2026-10-23-akses-multi-divisi-design.md` §7.

**Tujuan:** setiap transaksi mencatat siapa yang menginput dan siapa yang terakhir mengubah; tampil di form transaksi dan di tab Detail ekspor.

## Keputusan

- `transactions.created_by`, `transactions.updated_by`: uuid nullable → `users.id`, `on delete set null`. Data lama kosong → "—".
- Command menerima `userId: string | null` sebagai argumen terakhir (route mengisi `user.id`; `null` hanya untuk tes yang tidak menguji jejak, karena `testRoot` tidak punya baris DB).
- Buat (termasuk "Catat selisih" cek saldo) → `created_by` = `updated_by` = user. Ubah, hapus (soft delete), pulihkan → `updated_by` = user.
- `Transaction` menambah `createdBy`, `updatedBy` (id) dan `updatedAt`. `Ledger` memuat `people: Person[]` (`{ id, name }`, nama fallback email) untuk user yang dirujuk transaksi. `TransactionView` menambah `createdByName`, `updatedByName`.
- Form edit transaksi menampilkan "Diinput oleh X" dan, bila pernah diubah (`updatedAt` ≠ `createdAt`), "· Diubah oleh Y".
- Ekspor tab Detail: kolom **Diinput oleh**, **Diubah oleh** sebelum kolom Bon.

## Langkah

1. Schema + migrasi `0010_jejak_penginput.sql` (drizzle-kit generate).
2. Repo users: `selectUsersByIds`; tipe `Person` + `personName` (users).
3. Mapper/tipe transaksi; `getLedger` memuat `people`; `toTransactionViews` mengisi nama.
4. Commands: `createTransaction`, `updateTransaction`, `deleteTransaction`, `restoreTransaction`, `adjustBalanceCheck` menerima `userId`; route meneruskan `user.id`. Tes lama memakai `null`.
5. UI: baris jejak di form edit.
6. Ekspor: `ReportInput.people`, dua kolom baru.
7. Tes: jejak create/update/delete/restore/adjust, nama di view, kolom ekspor.
8. Verifikasi: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. E2E curl sekali.
