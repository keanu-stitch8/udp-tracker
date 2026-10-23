# Rilis 7: dua pagu — rencana ringkas

> Eksekusi inline di sesi yang sama (superpowers:executing-plans), TDD per tugas, tanpa commit sampai pengguna bilang "commit".

**Goal:** pagu punya *tarif management* (`rate`, wajib) dan *tarif karyawan* (`employee_rate`, opsional). Anggota melihat pagu tarif karyawan; Root/PM melihat keduanya plus cadangan (spec akses §8).

**Arsitektur:** semua angka tetap dihitung di `budgets/lib/budget.ts`. Pagu karyawan = pagu yang sama dengan `rate` diganti `employeeRate ?? rate` (`asEmployeeBudget`), sehingga rumus/basis tidak diduplikasi. Anggota hanya pernah menerima hasil `asEmployeeBudget`; tarif management tidak keluar dari server.

## Keputusan

- `employee_rate integer` null, CHECK `>= 0`. Validasi service: tarif karyawan ≤ tarif management (kalau lebih, cadangan negatif dan tidak masuk akal).
- Pagu tanpa tarif karyawan: untuk Root/PM pagu karyawan = pagu management (tampilan sama seperti sekarang); **tidak dikirim ke anggota** (revisi pengguna).
- **Halaman Pagu** (Root/PM): kartu "Total pagu" di atas (pagu karyawan, pagu management, cadangan, terpakai, status: lebih pagu karyawan tertutup cadangan / lebih pagu management). Kartu per pagu: bar terhadap pagu karyawan, rumus karyawan + rumus management (bila beda), lebih pagu karyawan dan lebih pagu management.
- **Kalender** detail hari: anggota = pagu karyawan saja (redaksi sementara Rilis 3 dicabut). Root/PM = batas karyawan + "Pagu management Rp X" bila beda; kelebihan atas pagu karyawan diberi keterangan "tertutup cadangan" bila masih ≤ batas management.
- **Ekspor** tab Pagu (khusus manage): kolom tambahan Pagu karyawan & Lebih pagu karyawan, baris Cadangan; rincian harian tambah Batas karyawan.
- Beranda tetap tanpa pagu.

## Tugas

1. **Skema + migrasi 0013** — `src/db/schema.ts` (`employeeRate: integer()`, check `budgets_employee_rate_nonnegative`), `npm run db:generate -- --name dua_pagu`, `npm run db:migrate` ke branch `dev`.
2. **Tipe, input, mapper, service** — `types/budget.ts` (`employeeRate`), `types/budget-input.ts` (`employeeRate` nullish), `mappers/budget.ts`, `services/budgets.ts` `planBudget` (tolak `employeeRate > rate`, field `employeeRate`), `tests/helpers/ledger-fixture.ts`. Tes: `budgets.test.ts` simpan + tolak.
3. **lib/budget** — `asEmployeeBudget(budget)`, `dualTotal(budgets, ctx, entries)` → `{ employeeLimit, managementLimit, reserve, used, overEmployee, overManagement }`. Tes `lib/budget.test.ts`.
4. **Kalender** — `getDayDetail`: anggota → `dailyBudgetUsage(asEmployeeBudget(b))`; Root/PM → plus `managementLimit`. `DailyBudgetUsage.managementLimit?`. `day-detail.tsx`. Tes redaksi: respons anggota tidak berisi tarif/batas management.
5. **Halaman Pagu** — `queries/budget-settings.ts` (`employeeLimit`, `employeeFormula`, `employeeOverBy`, `total`), `components/budget-settings.tsx`, `components/budget-form.tsx` (label "Tarif management", isian "Tarif karyawan (opsional)", pratinjau dua rumus).
6. **Ekspor** — `exports/lib/report.ts` `budgetTab` + tesnya.
7. **Verifikasi** — `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`, E2E curl sekali (anggota vs PM ke `days/[date]`), update HANDOFF.
