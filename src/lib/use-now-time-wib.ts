"use client";

import { useSyncExternalStore } from "react";
import { nowTimeWib } from "@/modules/shared/lib/date";

// Cek ulang tiap 15 detik; React juga membaca ulang saat halaman yang disembunyikan <Activity> tampil lagi.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
};

/** Jam sekarang (WIB, HH:mm) yang ikut berjalan. `serverTime` dipakai saat SSR/hydration. */
export function useNowTimeWib(serverTime: string): string {
  return useSyncExternalStore(subscribe, nowTimeWib, () => serverTime);
}
