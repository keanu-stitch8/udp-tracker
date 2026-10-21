"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Cache Components menyembunyikan halaman yang ditinggalkan dengan <Activity> (bukan dibongkar), jadi state form
 * tetap ada saat halaman dibuka lagi (node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md).
 * Untuk form "buat baru": panggil `resetWhenHidden()` setelah simpan sukses, lalu pakai `resetKey` sebagai `key`
 * form. Saat halaman disembunyikan, key naik → kunjungan berikutnya mulai kosong. Draf yang belum disimpan tetap ada.
 */
export function useResetAfterSave(): { resetKey: number; resetWhenHidden: () => void } {
  const [resetKey, setResetKey] = useState(0);
  const pending = useRef(false);

  // Cleanup layout effect jalan sinkron saat Activity menyembunyikan halaman (juga saat unmount — aman diabaikan).
  useLayoutEffect(
    () => () => {
      if (!pending.current) return;
      pending.current = false;
      setResetKey((key) => key + 1);
    },
    [],
  );

  const resetWhenHidden = useCallback(() => {
    pending.current = true;
  }, []);

  return { resetKey, resetWhenHidden };
}
