"use client";

import { useState } from "react";

/**
 * Nilai form yang default-nya dihitung server (mis. jam sekarang). Cache Components mempertahankan state form saat
 * halaman dibuka lagi, tapi props dari server sudah baru → selama belum diubah (`isDefault`), nilai ikut default
 * terbaru, bukan default saat pertama kali dirender. `initial` (form ubah) dianggap sudah diubah.
 */
export function useServerDefault<T>(initial: T | undefined, serverDefault: T): [value: T, set: (value: T) => void, isDefault: boolean] {
  const [override, setOverride] = useState<{ value: T } | null>(initial === undefined ? null : { value: initial });
  return [override ? override.value : serverDefault, (value: T) => setOverride({ value }), override === null];
}
