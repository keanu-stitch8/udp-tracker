# Rencana ringkas: Notifikasi (spec `docs/superpowers/specs/2026-10-24-notifikasi-design.md`)

Dieksekusi inline di sesi yang sama, TDD per tugas.

1. **Skema + migrasi 0014**: `activities`, `notification_reads` di `src/db/schema.ts`; `npm run db:generate`; terapkan ke branch `dev` (`npm run db:migrate`). Production ikut saat deploy.
2. **`notifications/lib/activity.ts`** (+ tes): `ActivitySnapshot`, `snapshotOf(transaction, refs, receipts)`, `activityChanges(before, after)`, `activityText(activity, viewerId)`.
3. **`notifications/lib/notifications.ts`** (+ tes): tipe `NotificationItem`/`NotificationGroup`, `groupKeysFor`, slug ↔ key, `followupItems`, `accessItems`, `badgeCount`.
4. **Rekam aktivitas**: `api/activities-repo.ts`, `services/record-activity.ts`; panggil di 5 command `transactions/commands/save-transaction.ts` (dalam `db.transaction`). Tes DB di `notifications.test.ts`.
5. **Query + mark seen**: `api/reads-repo.ts`, `queries/notifications.ts`, `commands/mark-seen.ts`; `dashboard/lib/attention.ts` ekstrak `latestChecks`. Tes DB visibilitas/unread/akses.
6. **Route**: `app/api/projects/[projectId]/notifications/route.ts` (GET), `…/notifications/seen/route.ts` (POST).
7. **UI**: `hooks/keys.ts`, `hooks/use-notifications.ts`; `components/notification-bell.tsx` (popover), `components/notification-list.tsx` + halaman; section bell di `AppHeader` (prop `bell`); `sub-page.ts` "/notifikasi"; `useLedgerMutation` invalidate notifikasi.
8. **Verifikasi**: `npm run ui:check && npm run lint && npm run typecheck && npm test && npm run build`; cek visual sekali di `localhost:3051` oleh pengguna. Perbarui HANDOFF.
