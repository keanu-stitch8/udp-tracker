# Impor riwayat tol — rencana ringkas

> Spec: `docs/superpowers/specs/2026-10-23-riwayat-tol-design.md`. Eksekusi inline, TDD per tugas, tanpa commit sampai pengguna bilang "commit".

1. **Scan** — `receipts/types/receipt.ts` (`TollTap`, `ReceiptScan.kind/tolls`), `lib/receipt-prompt.ts` (aturan + schema `kind`, `tolls`), `mappers/receipt-scan.ts` (`toTolls`). Tes: `mappers/receipt-scan.test.ts`, `lib/receipt-prompt.test.ts`.
2. **Duplikat** — `transactions/lib/toll.ts`: `tollKey`, `recordedTollKeys(views, walletId)`. Tes `toll.test.ts`.
3. **Simpan sekaligus** — `createTransactions(db, projectId, input, actor)` di `commands/save-transaction.ts` (1–50 item, satu transaksi DB, error per baris `transactions.N.field`), route `api/projects/[projectId]/transactions/batch/route.ts` (`projectRoute("transact")`), hook `useCreateTransactions`. Tes di `transactions.test.ts`; `tests/route-guard.test.ts` otomatis mencakup route baru.
4. **Blob bersama** — `attachments-repo.selectPathnamesInUse`, `updateTransaction` hanya menghapus file yang tidak dipakai lagi. Tes di `receipts/attachments.test.ts`.
5. **Ekspor** — `export-report.ts`: pathname yang sudah di Drive dipakai ulang. Tes ekspor bila ada gateway palsu.
6. **UI** — `transactions/components/toll-history-panel.tsx`, integrasi `transaction-form.tsx` (form baru, scan `toll_history` → panel; Batal → form biasa).
7. **Verifikasi** — ui:check, lint, typecheck, test, build; uji scan nyata dua screenshot Serena lewat skrip (Gemini) bila kuota ada; HANDOFF.
