"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WalletScope } from "../lib/scope";

const WalletScopeContext = createContext<WalletScope>(null);

/** Cakupan dompet user di proyek aktif untuk tampilan (baris transaksi bisa diklik, tombol cek saldo). Server tetap menegakkan. */
export function WalletScopeProvider({ scope, children }: { scope: WalletScope; children: ReactNode }) {
  return <WalletScopeContext value={scope}>{children}</WalletScopeContext>;
}

export function useWalletScope(): WalletScope {
  return useContext(WalletScopeContext);
}
