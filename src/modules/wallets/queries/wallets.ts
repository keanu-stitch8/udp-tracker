import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import type { Category } from "@/modules/budgets/types/category";
import type { Vehicle } from "@/modules/projects/types/project";
import { getLedger } from "@/modules/transactions/queries/ledger";
import type { Person } from "@/modules/users/types/user-list";
import { selectBalanceChecks } from "../api/balance-checks-repo";
import { selectProjectHolderHistory } from "../api/holders-repo";
import { dailyBalances, walletBalances, type BalancePoint } from "../lib/balances";
import { toBalanceCheck } from "../mappers/balance-check";
import { toWalletHolderRecord } from "../mappers/wallet-holder";
import type { BalanceCheck } from "../types/balance-check";
import type { WalletBalance } from "../types/wallet";
import type { WalletHolderRecord } from "../types/wallet-holder";

export interface WalletListItem extends WalletBalance {
  vehicleName: string | null;
  /** Pemegang aktif: anggota yang boleh mencatat di dompet ini (spec pemegang dompet). */
  holders: Person[];
}

export interface WalletList {
  projectId: string;
  locked: boolean;
  vehicles: Vehicle[];
  /** Semua dompet termasuk yang diarsipkan, urut sortOrder. */
  wallets: WalletListItem[];
  /** Semua periode pegangan dompet proyek, terbaru dulu. */
  holderHistory: WalletHolderRecord[];
}

export const getWalletList = cache(async (db: Db, projectId: string): Promise<WalletList> => {
  const [ledger, holderRows] = await Promise.all([getLedger(db, projectId), selectProjectHolderHistory(db, projectId)]);
  const holderHistory = holderRows.map(toWalletHolderRecord);
  const balances = walletBalances(ledger.wallets, ledger.transactions);
  const vehicleNames = new Map(ledger.project.vehicles.map((v) => [v.id, v.name]));
  return {
    projectId,
    locked: ledger.project.status === "done",
    vehicles: ledger.project.vehicles,
    wallets: ledger.wallets.map((w) => ({
      ...w,
      balance: balances.get(w.id) ?? w.openingBalance,
      vehicleName: w.vehicleId ? (vehicleNames.get(w.vehicleId) ?? null) : null,
      holders: holderHistory.filter((h) => h.walletId === w.id && !h.revokedAt).map((h) => ({ id: h.userId, name: h.name })),
    })),
    holderHistory,
  };
});

export interface WalletDetail {
  projectId: string;
  locked: boolean;
  vehicles: Vehicle[];
  wallet: WalletListItem;
  /** Periode pegangan dompet ini (aktif & dicabut), terbaru dulu. */
  holderHistory: WalletHolderRecord[];
  /** Saldo akhir per tanggal mutasi → pratinjau saldo s/d tanggal di form cek saldo. */
  balanceHistory: BalancePoint[];
  /** Riwayat cek saldo, terbaru dulu. */
  checks: BalanceCheck[];
  /** Kategori aktif untuk mencatat selisih. */
  categories: Category[];
}

export const getWalletDetail = cache(async (db: Db, projectId: string, walletId: string): Promise<WalletDetail> => {
  const [ledger, list] = await Promise.all([getLedger(db, projectId), getWalletList(db, projectId)]);
  const wallet = list.wallets.find((w) => w.id === walletId);
  if (!wallet) throw new NotFoundError("Dompet tidak ditemukan.");
  const adjustments = new Map(ledger.transactions.filter((t) => t.balanceCheckId).map((t) => [t.balanceCheckId!, t.id]));
  const checkRows = await selectBalanceChecks(db, wallet.id);
  return {
    projectId,
    locked: list.locked,
    vehicles: list.vehicles,
    wallet,
    holderHistory: list.holderHistory.filter((h) => h.walletId === wallet.id),
    balanceHistory: dailyBalances(wallet, ledger.transactions),
    checks: checkRows.map((row) => toBalanceCheck(row, adjustments.get(row.id) ?? null)),
    categories: ledger.categories.filter((c) => !c.archived),
  };
});
