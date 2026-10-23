# Rilis 5: Pemegang dompet + Lihat sebagai — rencana

Spec: `docs/superpowers/specs/2026-10-23-pemegang-dompet-design.md`.

## Keputusan teknis

- Cakupan dompet `WalletScope = string[] | null` (`null` = semua). Murni di `wallets/lib/scope.ts` (`inScope`, `canTransact`) agar dipakai server dan klien.
- Command ledger menerima argumen terakhir `actor: LedgerActor | null` (`{ userId, scope }`), menggantikan `userId` Rilis 4. `null` = tanpa jejak & tanpa batasan (tes lama). Route membangunnya lewat `ledgerActor(access)`.
- `ActiveProject` menambah `walletScope`. Komponen klien (daftar, beranda, kalender, form, detail dompet) menerima `scope` dari section-nya.
- Bottom nav: `BottomNavSection` (server) menentukan tombol "+"; `AppShell` menerima `nav`.
- Lihat sebagai: cookie httpOnly `udp_view_as` (`{ projectId, userId }`). `getSessionUser` = pemilik sesi; `getCurrentUser` = pengguna efektif (target bila cookie valid). `wrap` menolak non-GET selama mode aktif (kecuali `publicRoute`). Callback & start hubungkan Google menolak mode ini. Login/logout menghapus cookie.

## Langkah

1. Schema `wallet_holders` + migrasi 0011.
2. Repo pemegang, `walletScope`, `ledgerActor`, `assertWalletInScope`.
3. Command transaksi & cek saldo menegakkan cakupan; route meneruskan actor. Tes lama tetap `null`.
4. API pemegang (GET/PUT) + command `setWalletHolders` (harus anggota). Keluarkan anggota / tolak akun → pegangan dihapus.
5. Daftar dompet + detail: nama pemegang; panel Pemegang (Root/PM) dengan `UserPicker`.
6. UI cakupan: bottom nav, baris transaksi, form baru/edit, chip dompet, tombol cek saldo.
7. Lihat sebagai: cookie, pengguna efektif, blokir tulis, banner, tombol di Anggota proyek, route mulai/keluar.
8. Tes: matriks cakupan, holders, lihat sebagai. Verifikasi penuh + E2E curl.
