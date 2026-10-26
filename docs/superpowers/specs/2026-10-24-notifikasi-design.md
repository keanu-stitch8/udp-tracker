# Notifikasi (lonceng) — desain

Disetujui pengguna 2026-10-24. Pola mengikuti panel notifikasi Binance: popover berisi grup, angka, item terbaru, "Lihat semua" → halaman penuh dengan filter grup.

## Grup

| Grup (`key`, slug URL) | Root | PM | Anggota | Angka |
| --- | --- | --- | --- | --- |
| Perlu ditindaklanjuti (`followup`, `tindak-lanjut`) | semua transaksi tanpa bon + selisih cek saldo, dompet minus, reimburse | sama dengan Root | transaksi tanpa bon di dompet yang dia pegang | jumlah item terbuka |
| Aktivitas (`activity`, `aktivitas`) | semua aktivitas transaksi di proyek | sama dengan Root | hanya aktivitasnya sendiri | unread: aktivitas **orang lain** setelah `seen_at` (anggota selalu 0) |
| Akun & akses (`access`, `akun`) | user menunggu persetujuan | — | — | jumlah item terbuka |

- Perlu ditindaklanjuti dan Akun & akses **dihitung langsung** dari data (tidak disimpan) → hilang sendiri saat beres.
- Item transaksi tanpa bon: "Bensin Rp 200.000 belum ada bon", waktu "22/10 14:30" (tanggal+jam transaksi), link `/transaksi/{id}` (form Ubah). Aturan "tanpa bon" = `isMissingReceipt` (sama dengan beranda). Item dompet memakai `attentionItems` beranda (tanpa baris ringkasan bon), link ke dompet, tanpa waktu.
- Akun & akses: "Nama (email) menunggu persetujuan", waktu = daftar, link `/lainnya/pengguna`.

## Aktivitas

Tabel `activities`: `id`, `project_id` (cascade), `actor_id` (users, set null), `kind` (`transaction_created|transaction_updated|transaction_deleted|transaction_restored`; teks, siap ditambah), `transaction_id` (cascade, null untuk kind non-transaksi nanti), `before`/`after` jsonb, `created_at`. Index `(project_id, created_at)`.

- Ditulis **di dalam `db.transaction` command yang sama** (`createTransaction`, `createTransactions` satu per transaksi, `updateTransaction`, `deleteTransaction`, `restoreTransaction`). `actor = null` (tes/sistem) → `actor_id` null. Penyesuaian cek saldo tidak dicatat (bukan aksi transaksi pengguna).
- Snapshot (`ActivitySnapshot`): `type`, `label` (transfer "A → B", selain itu nama kategori ?? merchant ?? "Transaksi"), `amount`, `date`, `time`, `walletName`, `receipts` (jumlah bon). Nama disimpan saat kejadian; ganti nama kategori/dompet tidak mengubah riwayat.
- Teks (pelaku = "Anda" bila pelaku = yang melihat, selain itu nama/email, null → "Sistem"):
  - tambah: "Arpan menambahkan Bensin Rp 200.000 untuk 22/10 jam 14:30"
  - ubah: "Anda mengubah Parkir: nominal Rp 10.000 → Rp 15.000, jam 14:30 → 15:00" (field: kategori/label, nominal, tanggal, jam, dompet, bon "bon ditambahkan"/"bon dihapus"); tanpa perubahan field itu: "Anda mengubah Parkir Rp 10.000 (22/10 14:30)"
  - hapus: "Budi menghapus Snack & Air Minum Rp 45.000 (21/10 09:10)"; pulihkan: "… memulihkan …"
- Waktu item = `created_at` WIB "dd/mm HH:mm". Link `/transaksi/{id}` bila transaksi masih ada (tidak terhapus) dan dompetnya dalam cakupan yang melihat; selain itu tanpa link.
- Data lama tidak di-backfill.

## Unread

Tabel `notification_reads`: `user_id`, `project_id`, `group`, `seen_at`; PK ketiganya. Saat ini hanya grup `activity` yang memakainya.

- Item aktivitas `unread` = pelaku bukan yang melihat dan `created_at > seen_at` (belum pernah → semua unread).
- Membuka `/notifikasi` dengan grup Semua atau Aktivitas → `POST …/notifications/seen` `{ group: "activity" }` (dari klien setelah render; titik unread di daftar yang sedang dibuka tetap tampil). Popover tidak menandai terbaca.
- Badge lonceng = jumlah angka semua grup (tampil "99+" bila > 99).

## UI

- **Lonceng** di header kanan, kiri avatar, di semua halaman (header proyek dan sub-halaman). Hanya bila ada proyek aktif.
- **Popover** (NeoBrutalism `popover`) selebar kolom app (maks 480px dikurangi gutter), tinggi maks 70dvh, scroll. Atas: "NOTIFIKASI" + "Lihat semua ›" (`/notifikasi`). Tiap grup: ikon + nama + angka + › (link `/notifikasi?grup=slug`), lalu maks **5 item** terbaru (teks, waktu, titik unread; tap → link, popover tertutup sebelum navigasi). Grup kosong: "Belum ada kabar".
- **Halaman `/notifikasi`** (sub-halaman "Notifikasi", kembali ke `/`): `AppSelect` grup (Semua + grup milik peran), daftar per grup maks 100 item terbaru (Semua: tiap grup bersection). URL `?grup=slug`; slug tak dikenal → Semua.
- Data klien: TanStack Query `notificationKeys.summary(projectId)` (popover, `refetchInterval` 60 dtk + saat fokus) dan `notificationKeys.list(projectId, group)` (halaman). Mutasi buku kas (`useLedgerMutation`) ikut meng-invalidate `notificationKeys.all(projectId)`. Setelah `seen`, hanya `summary` yang di-invalidate.

## Arsitektur

Modul baru `src/modules/notifications`:

- `lib/activity.ts` (murni): `snapshotOf`, `activityText`, `activityChanges`; `lib/notifications.ts`: `followupItems`, `accessItems`, `activityItems`, `groupsFor(role, isRoot)`, `badgeCount`.
- `api/activities-repo.ts`, `api/reads-repo.ts`.
- `services/record-activity.ts`: `recordActivity(tx, …)` dipanggil command transaksi.
- `queries/notifications.ts`: `getNotifications(db, { projectId, user, role, scope }, { group?, limit })` → `{ groups: NotificationGroup[] }`.
- `commands/mark-seen.ts`.
- Route `GET /api/projects/[projectId]/notifications?grup=&limit=` dan `POST …/notifications/seen` (`projectRoute("view")`).
- `sections/notification-bell-section.tsx` (prefetch summary), `components/notification-bell.tsx`, `components/notification-list.tsx`, view + `app/(app)/notifikasi/page.tsx`.
- `dashboard/lib/attention.ts`: ekstrak `latestChecks(rows, transactions)` dipakai notifikasi (beranda tidak lagi menampilkan tindak lanjut).

## Tes

- Murni: teks/perubahan aktivitas, item tindak lanjut per cakupan, unread, badge.
- DB (PGlite): command menulis aktivitas (termasuk batch, rollback saat gagal), visibilitas (anggota hanya miliknya, PM semua), unread + `markSeen`, grup akses hanya Root.
- Penjaga route otomatis mencakup route baru (`projectRoute`).
