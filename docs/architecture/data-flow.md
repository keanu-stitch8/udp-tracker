# Alur data global

Kontrak ini diadaptasi dari `srikandi-merdeka-cup/docs/architecture/data-flow.md` dan menjadi sumber kebenaran untuk alur data dan kepemilikan folder di `src/`. Bagian "Adaptasi" mencatat pengecualian yang disengaja beserta alasannya.

## Arah dependensi

Baca (render server):

```text
app route → module index → view (komposisi + Suspense) → section (batas async server)
  → query (orkestrasi + dedupe) → service (validasi + aturan bisnis) → api (adapter/repo) → Neon / API eksternal
```

Baca (refresh dari browser):

```text
hook (useQuery) → app/api route (parse HTTP + sesi) → query yang SAMA → service → api
```

Tulis:

```text
form → hook (useMutation) → app/api route (parse HTTP + sesi) → command (db.transaction) → service → api (repo) → Neon
onSuccess → invalidate query key terkait
```

Jangan melompati layer:

- Komponen tidak memanggil DB/API eksternal.
- Route `app/api` tidak menduplikasi logika service/domain.
- Adapter/repo tidak membuat model UI.
- Row DB / respons eksternal mentah tidak sampai ke view atau komponen.
- Layer bawah tidak mengimpor dari layer render/routing.

## Kontrak folder

| Folder/file | Pemilik | Aturan |
| --- | --- | --- |
| `src/app/**/page.tsx` | entri route | Tipis: teruskan ke module. |
| `src/app/api/**/route.ts` | batas HTTP browser | Bungkus dengan `route()`; parse input, panggil query/command, serialisasi hasil. |
| `src/modules/*/index.tsx` | batas publik module | Delegasi ke view. Tanpa fetch/validasi/mapping. |
| `views/` | komposisi halaman + Suspense | Tanpa transport/normalisasi. |
| `sections/` | batas async server | Baris pertama `await connection()` jika membaca DB/cookies. Panggil query, prefetch ke QueryClient + `HydrationBoundary`, pilih state missing. |
| `queries/` | orkestrasi baca (server-only) | React `cache()` untuk dedupe per request. |
| `commands/` | orkestrasi tulis (server-only) | Satu use case mutasi dalam satu `db.transaction`. |
| `services/` | use case + validasi (server-only) | zod (`parseOrThrow`), aturan bisnis, panggil mapper. |
| `api/` | adapter transport (server-only) | Repo Drizzle per tabel & adapter eksternal; kembalikan row/`unknown` mentah. |
| `mappers/` | batas kepercayaan | Row/JSON mentah → tipe kanonik. |
| `lib/` | logika domain murni | Tanpa network, DB, state React, API browser. Wajib diuji. |
| `types/` | kontrak kanonik | Tipe + skema zod input yang client-safe. |
| `hooks/` | client-only | Hook TanStack Query + query key factory; hanya memanggil `/api/*`. |
| `components/` | render + interaksi lokal | `'use client'` hanya jika perlu. |
| `src/components/ui/` | NeoBrutalism | **Tidak pernah diedit**; dijaga `npm run ui:check`. |
| `src/components/app/` | komponen app lintas module | Membungkus/meng-compose `ui`. |

## Adaptasi dari kontrak srikandi

1. **`commands/`**: kontrak asal hanya punya alur baca. App ini sebagian besar menulis, jadi `commands/` menjadi pasangan `queries/`.
2. **`api/` mencakup repo DB**: fungsi Drizzle diperlakukan sebagai adapter transport, setara dengan adapter API eksternal (Gemini, Google, Blob).
3. **Cache**: tidak ada `'use cache'` persisten untuk data keuangan karena data harus segar setelah mutasi. Otoritas kesegaran adalah DB. React `cache()` hanya untuk dedupe per request, dan cache browser dipegang TanStack Query (invalidate pada `onSuccess`). Karena `cacheComponents` aktif, setiap akses DB/cookies di halaman berada di dalam `<Suspense>`.
4. **`hooks/`**: folder client-only untuk TanStack Query. Query key factory berada di `hooks/keys.ts` agar section server dapat mem-prefetch dengan key yang sama.

## Batas runtime

- `queries/`, `commands/`, `services/`, `api/`, `src/db/client.ts`, `src/lib/env.ts`, dan `src/lib/http.ts` mengimpor `server-only`.
- `src/lib/session.ts` sengaja tanpa `server-only`/`Buffer` karena dipakai `src/proxy.ts`.
- Fungsi server menerima `db: Db` sebagai parameter pertama. Produksi memakai `getDb()` (Neon), test memakai `createTestDb()` (PGlite).

## Missing, empty, failed

- **Missing:** `NotFoundError` → 404 (API) / `notFound()` (halaman).
- **Empty:** data ada tapi kosong → empty state dengan CTA.
- **Failed:** error DB/eksternal → error boundary per section / respons 500. Jangan diubah menjadi data kosong.

## Checklist perubahan

1. Tentukan kontrak sumber, tipe kanonik, pemilik cache, dan semua konsumen.
2. Ubah di layer yang tepat (transport, validasi, mapping, domain, render).
3. Pertahankan jalur query yang sama untuk render server dan endpoint browser.
4. Uji missing/empty/failed secara terpisah.
5. Tambah/ubah test di batas yang berubah.
