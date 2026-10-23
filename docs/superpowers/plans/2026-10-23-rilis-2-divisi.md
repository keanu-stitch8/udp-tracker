# Rilis 2: Divisi — rencana

> Dieksekusi inline (superpowers:executing-plans), TDD per task. Spec: `docs/superpowers/specs/2026-10-23-akses-multi-divisi-design.md` §1, §4, §10.

**Tujuan:** setiap proyek masuk satu divisi; divisi dikelola di `/lainnya/divisi`; pemilih proyek dikelompokkan per divisi; form proyek baru dan pengaturan proyek punya pilihan divisi.

**Di luar rilis ini:** peran Root/PM (Rilis 3). Sampai Rilis 3, siapa pun yang login boleh mengelola divisi, sama seperti pengaturan lain sekarang.

## Task 1: Skema + migrasi 0007

- `src/db/schema.ts`: tabel `divisions` (`id`, `name`, timestamps). `projects.divisionId` uuid **not null**, FK `restrict`, index `projects_division_idx`.
- `npm run db:generate -- --name divisi` lalu sunting SQL agar aman untuk data lama:
  1. `CREATE TABLE divisions`.
  2. `INSERT INTO divisions (name) VALUES ('Umum')`. Juga memastikan DB baru selalu punya satu divisi.
  3. `ALTER TABLE projects ADD COLUMN division_id uuid` (nullable dulu), `UPDATE projects SET division_id = (SELECT id FROM divisions LIMIT 1)`, `ALTER COLUMN division_id SET NOT NULL`, FK, index.
- `tests/helpers/test-db.ts`: `testDivisionId(db)` = id divisi pertama.
- Tes (`tests/db-schema.test.ts`): migrasi membuat divisi "Umum"; proyek tanpa `division_id` ditolak; hapus divisi yang masih berisi proyek ditolak FK. Insert proyek langsung di tes lama diberi `divisionId`.

## Task 2: Modul `divisions` (server)

File baru, mengikuti pola grup kategori:

- `src/modules/divisions/types/division.ts`: `Division { id, name, projectCount }`.
- `src/modules/divisions/types/division-input.ts`: `divisionInputSchema` (nama trim, 1–50 karakter).
- `src/modules/divisions/api/divisions-repo.ts`: `selectDivisions`, `selectDivision`, `insertDivision`, `updateDivisionRow`, `deleteDivisionRow`, `countProjectsByDivision`.
- `src/modules/divisions/services/divisions.ts`: `planDivision(input, otherNames)` (nama unik tanpa beda huruf besar), `findDivisionOrThrow(db, id)` (uuid tidak valid → NotFound).
- `src/modules/divisions/commands/save-division.ts`: `createDivision`, `renameDivision`, `deleteDivision` (berisi proyek → `ConflictError("Divisi masih berisi N proyek. Pindahkan proyeknya dulu.")`).
- `src/modules/divisions/queries/divisions.ts`: `listDivisions(db)` urut A–Z (`localeCompare("id")`), dengan `projectCount`.
- Tes `src/modules/divisions/divisions.test.ts` (PGlite): buat, nama ganda ditolak (beda huruf besar), ganti nama, hapus kosong, hapus berisi ditolak, daftar urut A–Z + jumlah proyek.

## Task 3: Proyek punya divisi

- `types/project.ts`: `Project.divisionId`.
- `mappers/project.ts`: petakan `divisionId`.
- `types/project-input.ts`: `createProjectSchema.divisionId` (uuid wajib, pesan "Pilih divisi."), `updateProjectSchema.divisionId` (opsional).
- `commands/create-project.ts` dan `update-project.ts`: `findDivisionOrThrow` bila `divisionId` ada; error dipetakan ke field `divisionId`.
- Semua pemanggil `createProject` di tes ditambah `divisionId: await testDivisionId(db)`.
- Tes `projects.test.ts`: proyek tersimpan dengan divisinya; divisi tidak ada → ValidationError di `divisionId`; pindah divisi lewat update.

## Task 4: Pengelompokan proyek (lib murni)

- `src/modules/projects/lib/group-by-division.ts`: `groupProjectsByDivision(projects, divisions)` → `{ division, projects }[]`, divisi A–Z, divisi tanpa proyek tidak tampil, urutan proyek di dalam tetap seperti input.
- Tes `group-by-division.test.ts`.

## Task 5: API + hooks

- `src/app/api/divisions/route.ts`: GET (`listDivisions`), POST (`createDivision`, 201).
- `src/app/api/divisions/[divisionId]/route.ts`: PATCH (rename), DELETE (204).
- `src/modules/divisions/hooks/keys.ts`, `hooks/use-divisions.ts`: `useDivisions`, `useSaveDivision(id?)`, `useDeleteDivision()`. Simpan/hapus divisi meng-invalidate `divisionKeys.all` dan `projectKeys.all`.

## Task 6: UI

- **Halaman Divisi** `/lainnya/divisi` (`src/app/(app)/lainnya/divisi/page.tsx` → `DivisionsView` → `DivisionsSection` prefetch → `DivisionSettings`): daftar divisi dengan jumlah proyek, Tambah, Ganti nama (form inline seperti grup kategori), Hapus dengan konfirmasi dua langkah (tombol dinonaktifkan dengan keterangan bila masih berisi proyek).
- **Menu Lainnya**: tautan "Divisi" (ikon `Building2`) sebelum "Ganti / buat proyek".
- **Pemilih proyek** (`project-list.tsx` + section prefetch divisi): judul divisi per kelompok (`groupProjectsByDivision`).
- **Form proyek baru**: `AppSelect` divisi di urutan pertama; bawaan = divisi proyek aktif, atau divisi pertama A–Z. Tidak ada divisi → pesan "Buat divisi dulu" + tautan.
- **Pengaturan proyek**: `AppSelect` divisi, ikut tombol Simpan yang ada.

## Task 7: Verifikasi

- `npm run ui:check && npm run lint && npm run typecheck && npx vitest run --maxWorkers=4 && npm run build`, gerbang exit code.
- Migrasi ke branch Neon **`dev`**: `npm run db:migrate` (`.env.local` → `dev`). Production bermigrasi saat deploy.
- E2E curl sekali (`next start -p 3100`, DB `dev`): GET/POST/PATCH/DELETE `/api/divisions`, buat proyek dengan dan tanpa `divisionId`, hapus divisi berisi → 409. Bersihkan data uji.
- Update HANDOFF. Tidak commit sampai pengguna bilang.
