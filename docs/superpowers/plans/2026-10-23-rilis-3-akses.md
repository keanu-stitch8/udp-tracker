# Rilis 3: Login Google, akun, peran, penegakan akses — rencana

> Dieksekusi inline (superpowers:executing-plans), TDD per task. Spec: `docs/superpowers/specs/2026-10-23-akses-multi-divisi-design.md` §1–§6, §9, §10.

**Tujuan:** setiap orang login dengan Google dan hanya bisa melihat/mengubah proyek yang menjadi haknya (Root / PM divisi / anggota proyek). Password aplikasi dibuang. Koneksi Google untuk ekspor menjadi per user.

**Keputusan pengguna 2026-10-23 (menyimpang dari spec):**

1. **Satu callback OAuth.** Login dan hubungkan-ekspor sama-sama memakai `/api/auth/google/callback` (sudah terdaftar di Cloud Console untuk `http://localhost:3051` dan `https://udp-tracker.vercel.app`). Tujuan dibedakan lewat cookie state (`purpose: "login" | "connect"`). Route mulai login: `/api/auth/google/login`; mulai hubungkan: `/api/auth/google/start` (tetap).
2. **Pagu disembunyikan dari anggota sampai Rilis 5.** Tarif karyawan belum ada, jadi peran tanpa `budgetSecret` menerima `budgets: []` di detail hari kalender. Halaman Pagu dan ekspor sudah khusus `manage`.

3. **Status akun terpisah dari penugasan (revisi pengguna, 2026-10-23).** Pengguna = Setujui / Tolak / Cabut akses + toggle Root. PM diatur per divisi di halaman Divisi, anggota di Anggota proyek; keduanya memilih dari **pool semua user aktif** (lintas divisi, karena personel kadang ditarik dari divisi lain). Root boleh sekaligus PM (label "Root · PM MKK"). Undang lewat email tetap ada untuk orang yang belum pernah login.

**Di luar rilis ini:** jejak penginput (Rilis 4), tarif karyawan (Rilis 5).

## Kontrak bersama (dipakai banyak task)

```ts
// src/modules/users/types/user.ts
export const USER_STATUSES = ["pending", "active", "rejected"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export interface CurrentUser { id: string; email: string; name: string | null; imageUrl: string | null; status: UserStatus; isRoot: boolean }
/** Siapa yang melakukan aksi (cukup untuk cek izin). */
export type Actor = Pick<CurrentUser, "id" | "isRoot">;

// src/modules/users/lib/access.ts (murni)
export type Role = "root" | "pm" | "member";
export type Capability = "view" | "transact" | "budgetSecret" | "manage";
export function can(role: Role | null, capability: Capability): boolean;

// src/lib/http.ts
route(handler: (request, ctx, auth: { user: CurrentUser }) => Promise<Response>, { public? })
rootRoute(handler)                                   // 403 bila bukan Root
projectRoute(capability, handler: (request, ctx, access: { user; role; projectId }) => …) // null → 404, kurang → 403

// src/modules/projects/queries/projects.ts
export interface ActiveProject extends ProjectDetail { role: Role }
getActiveProject(db): Promise<ActiveProject | null>  // hanya dari proyek yang boleh diakses user
requireActiveProject(db): Promise<ActiveProject>     // null → redirect /proyek/baru (bisa buat proyek) atau /proyek (empty state)
requireManagedProject(db): Promise<ActiveProject>    // tanpa `manage` → notFound()
```

Sesi: token = base64url(JSON `{ uid, exp }`) + HMAC. `verifySessionToken` mengembalikan `uid` atau `null`. Token lama (tanpa `uid`) tidak valid → semua orang login ulang.

## Task 1: Skema + migrasi 0008 (tambah) dan 0009 (buang)

Dua kali `db:generate` supaya drizzle-kit tidak menanyakan rename secara interaktif.

- `src/db/schema.ts`:
  - enum `user_status` (`USER_STATUSES` di `modules/shared/types/enums.ts`).
  - `users`: `id`, `email` (unik, not null), `name`, `imageUrl`, `status` default `pending`, `isRoot` default false, `lastLoginAt`, timestamps.
  - `divisionPms` (`division_pms`): `divisionId` → divisions cascade, `userId` → users cascade, PK gabungan.
  - `projectMembers` (`project_members`): `projectId` cascade, `userId` cascade, `addedBy` → users set null, `createdAt`, PK gabungan.
  - `projectInvitations` (`project_invitations`): `projectId` cascade, `email`, `invitedBy` → users set null, `createdAt`, PK (`projectId`, `email`).
  - `googleCredentials.userId` uuid not null unik → users cascade.
- `npm run db:generate -- --name akun`; sunting SQL: `DELETE FROM google_credentials;` sebelum `ADD COLUMN user_id … NOT NULL` (token lama dihapus, spec §1).
- Lalu buang `loginAttempts` dan `googleCredentials.id` (`userId` jadi primary key) → `npm run db:generate -- --name buang_password`.
- Tes `tests/db-schema.test.ts`: email ganda ditolak; hapus user meng-cascade `division_pms`/`project_members`; `google_credentials` per user.

## Task 2: Sesi + env

- `src/lib/session.ts`: `createSessionToken(secret, userId, now?)`, `verifySessionToken(token, secret, now?) → Promise<string | null>`.
- `src/proxy.ts`: `PUBLIC_PATHS` = `/login`, `/api/auth/google/login`, `/api/auth/google/callback`, `/api/auth/logout`.
- `src/lib/env.ts`: buang `APP_PASSWORD_HASH`; tambah `ROOT_EMAILS` opsional → `rootEmails: string[]` (huruf kecil, trim, kosong dibuang).
- Buang `scripts/hash-password.mts`, npm script `hash-password`, dependensi `@node-rs/argon2`, modul `auth/services/login.ts` + `auth/api/login-attempts-repo.ts` + tesnya, route `api/auth/login`, `login-form.tsx`.
- Tes: `session.test.ts` (uid kembali, kedaluwarsa, tanda tangan salah, token lama tanpa uid → null), `env.test.ts` (`ROOT_EMAILS` diparse).

## Task 3: Modul `users` — peran dan login

- `lib/access.ts`: `can()` sesuai tabel spec §2 (member: view + transact).
- `api/users-repo.ts`: `selectUser`, `selectUserByEmail`, `insertUser`, `updateUserRow`, `selectUsers`, `countRoots`.
- `api/access-repo.ts`: `selectPmDivisionIds(userId)`, `selectPmsByDivision()`, `replacePmDivisions(userId, ids)`, `selectMemberProjectIds(userId)`, `isProjectMember`, `insertMembers`, `deleteMembershipsOfUser`, `selectInvitationsByEmail`, `deleteInvitationsByEmail`.
- `services/project-role.ts`: `projectRole(db, user, projectId): Promise<Role | null>` (urutan spec §2; user tidak `active` → null) dan `accessibleProjectIds(db, user): Promise<"all" | string[]>`.
- `services/sign-in.ts`: `signInGoogleUser(db, profile: { email; emailVerified; name; picture }, { rootEmails, now })` dalam satu transaksi (spec §3 langkah 1–4). Email belum terverifikasi → `ValidationError`.
- `queries/current-user.ts`: `getCurrentUser = cache(async (db) => CurrentUser | null)` dari cookie sesi.
- Tes `users/access.test.ts` (PGlite): matriks `projectRole` (root, PM divisi sendiri, PM divisi lain, anggota, bukan anggota, pending, rejected) + tabel `can`; alur login (root dari env, undangan → anggota + undangan terhapus, user baru pending, rejected tetap rejected walau diundang, email belum terverifikasi ditolak, email disimpan huruf kecil).

## Task 4: Pembungkus route + penjaga statis

- `src/lib/errors.ts`: `ForbiddenError` (403).
- `src/lib/http.ts`: `requireUser()` (tanpa sesi/user → 401; `pending`/`rejected` → 403 "Akun belum aktif."), `route`, `rootRoute`, `projectRoute` (kontrak di atas).
- Semua `route.ts` di `src/app/api/projects/[projectId]/**` pindah ke `projectRoute`:
  - `view`: GET project, summary, calendar, days, transactions (list + satu), reference, attachments, wallets (list + satu), balance-checks GET, POST activate.
  - `transact`: transactions POST/PATCH/DELETE/restore, receipts, balance-checks POST, adjust.
  - `manage`: PATCH/DELETE project, settings, budgets*, categories*, category-groups*, vehicles*, wallets POST/PATCH, export, members*.
- `days/[date]`: `getDayDetail(db, projectId, date, { budgetSecret: can(role, "budgetSecret") })` → tanpa izin `budgets: []`.
- `api/divisions`: GET `route` (Root semua; PM divisinya; lainnya `[]`), POST/PATCH/DELETE `rootRoute`.
- Tes `tests/route-guard.test.ts`: setiap `route.ts` di bawah `api/projects/[projectId]` memakai `projectRoute(` dan tidak memakai `route(`; `api/divisions/[divisionId]` memakai `rootRoute(`.
- Tes `calendar` (PGlite): detail hari tanpa `budgetSecret` → `budgets` kosong.

## Task 5: Proyek mengikuti hak akses

- `queries/projects.ts`: `listProjectsFor(db, user)`; `getActiveProject`/`requireActiveProject`/`requireManagedProject`; cookie proyek aktif yang tidak boleh lagi → `pickActiveProject` memilih proyek lain yang boleh.
- `commands/create-project.ts`: `createProject(db, actor, input)`. Root: divisi mana pun; PM: hanya divisinya (`ValidationError` di `divisionId`: "Kamu bukan PM divisi ini."); lainnya `ForbiddenError`.
- `commands/update-project.ts`: `updateProject(db, actor, id, input)`; pindah divisi mengikuti aturan yang sama.
- `commands/delete-project.ts`: body `{ name }` harus sama dengan nama proyek (trim) → kalau tidak, `ValidationError` di `name`: "Nama proyek tidak cocok." Komponen `delete-project.tsx`: ketik ulang nama proyek.
- `divisions/queries/divisions.ts`: `listDivisionsFor(db, user)`; `Division.pms: { id, name, email }[]`.
- Semua section yang memanggil `getActiveProject` + `redirect("/proyek/baru")` → `requireActiveProject`. Pengaturan (pagu, kategori, ekspor, proyek, anggota) → `requireManagedProject`. `/proyek/baru` → `notFound()` bila tidak bisa membuat proyek. `/lainnya/divisi` → `notFound()` bila bukan Root.
- `/proyek`: tombol buat proyek hanya bila bisa membuat; daftar kosong + tidak bisa membuat → "Belum ada proyek. Minta PM menambahkan kamu."
- Dompet: tombol tambah/ubah dompet hanya untuk `manage` (cek saldo tetap untuk semua).
- Tes: `createProject` dengan `testRoot` (helper di `tests/helpers/test-db.ts`) di semua tes lama; PM divisi lain ditolak; `listProjectsFor` (root semua, PM divisinya, anggota proyeknya); hapus dengan nama salah ditolak.

## Task 6: Login Google

- `modules/google/lib/oauth-state.ts`: cookie state berisi base64url JSON `{ purpose, nonce, next }`; `readOAuthState`, `loginPageUrl(origin, message)`.
- `modules/google/services/google-oauth.ts`: `loginAuthUrl(origin, nonce)` (scope `openid email profile`, `prompt: "select_account"`), `googleProfileFromCode(code, origin)` (verifikasi id_token → `{ email, emailVerified, name, picture }`).
- Route `api/auth/google/login` (public): set cookie state `purpose: "login"` + `next` (lewat `safeNextPath`), redirect ke Google.
- Route `api/auth/google/callback` (public): cocokkan nonce; `login` → `signInGoogleUser` → set cookie sesi → redirect `next`; error → `/login?error=…`. `connect` → `requireUser()` lalu alur ekspor lama untuk user itu.
- Halaman `/login`: kartu NeoBrutalism, satu tombol "Masuk dengan Google" (ikon G inline SVG), pesan `?error`.
- Tes `oauth-state` (murni): encode/decode, nilai rusak → null, `next` tidak aman → "/".

## Task 7: Koneksi Google per user (ekspor)

- `google/api/credentials-repo.ts`: per `userId`. `googleAccount(db, userId)`, `authorizedClient(db, userId)`, `completeOAuth(db, userId, code, origin)`, `disconnectGoogle(db, userId)`.
- `exports`: `googleGateway(db, userId)`, `getExportStatus(db, projectId, userId)`.
- `api/google` GET/DELETE memakai user sesi.
- Tes `google.test.ts`: dua user, token terpisah; putuskan satu tidak menghapus yang lain.

## Task 8: Akun di layout + menu

- `users/sections/account-gate-section.tsx`: di `(app)/layout.tsx` membungkus `children`. User tidak ada → `redirect("/login")`; `pending` → "Menunggu konfirmasi admin" + email + Keluar; `rejected` → "Akses ditolak" + Keluar.
- Menu Lainnya jadi section server: kartu user (foto, nama, email) di atas; tautan disaring peran: Dompet (semua), Pagu/Kategori/Ekspor/Pengaturan proyek/Anggota proyek (`manage`), Divisi/Pengguna (Root), Ganti/buat proyek (semua).
- `sub-page.ts`: judul "Pengguna" dan "Anggota proyek".

## Task 9: Halaman Pengguna (Root) + PM di Divisi

- `users/commands/manage-users.ts`: `approveUser` (aktif tanpa penugasan), `setUserRoot(db, id, { isRoot })` (hanya akun aktif; tidak menyentuh PM), `rejectUser` (status `rejected`, Root, PM, keanggotaan dihapus). Root terakhir dilindungi (`ConflictError`).
- `divisions/commands/division-pms.ts`: `setDivisionPms(db, divisionId, { userIds })` mengganti daftar PM divisi; hanya user aktif.
- `users/queries/users.ts`: `listUsers` (halaman Pengguna) dan `listActiveUsers` (pool pemilih).
- Route (semua `rootRoute`): `api/users` GET, `api/users/[userId]/approve` POST, `api/users/[userId]/root` PUT, `api/users/[userId]/reject` POST, `api/divisions/[divisionId]/pms` PUT.
- UI: Pengguna = Tabs Menunggu/Aktif/Ditolak, label peran gabungan, Setujui, Jadikan/Cabut Root, Tolak/Cabut akses dengan konfirmasi. Divisi = bagian PM per kartu (+ PM dari `UserPicker`, hapus dengan konfirmasi).
- Tes: setujui tanpa penugasan, Root + PM sekaligus, cabut Root tidak menghapus PM, tolak menghapus semuanya dan bisa disetujui lagi, Root terakhir dilindungi, pool tanpa pending/ditolak, ganti PM divisi.

## Task 10: Anggota proyek (`manage`)

- Modul `members`: `listProjectMembers(db, projectId)` → `{ members, invitations, candidates }` (kandidat = pool user aktif yang belum anggota); `addMemberByEmail(db, actor, projectId, input)` sesuai tabel spec §4 (active → anggota, pending → aktif + anggota, belum ada → undangan, rejected → `ValidationError` "Akun ini ditolak admin."); `removeMember`, `cancelInvitation`.
- Route: `members` GET/POST, `members/[userId]` DELETE, `invitations/[email]` DELETE (semua `projectRoute("manage")`).
- UI `/lainnya/anggota`: "Pilih dari pengguna" (`UserPicker`), undang lewat email, daftar anggota + undangan, hapus/batalkan dengan konfirmasi.
- Tes: empat cabang status email, email ganda tidak dobel, hapus anggota, batalkan undangan, undangan berubah jadi anggota saat login (sudah di Task 3).

## Task 11: Verifikasi, E2E, dokumen

- Verifikasi penuh: `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`.
- Migrasi ke branch Neon `dev`: `npm run db:migrate`.
- E2E curl (`next start -p 3100`, token sesi dibuat skrip di scratchpad untuk user Root/PM/anggota/luar/pending yang di-insert ke `dev`): route kunci (summary, days, budgets, export, members, divisions, users) membalas 200/403/404 sesuai peran; anggota menerima `budgets: []`. Hapus data uji setelahnya.
- README: SOP login (ROOT_EMAILS, persetujuan akun), hapus bagian password. HANDOFF diperbarui.
- **Sebelum push (pengguna):** set `ROOT_EMAILS` di Vercel, hapus `APP_PASSWORD_HASH`. Setelah deploy: login Google, hubungkan ulang Google di Ekspor.
