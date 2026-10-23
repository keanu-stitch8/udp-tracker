import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import type { Category } from "@/modules/budgets/types/category";
import type { Vehicle } from "@/modules/projects/types/project";
import { getLedger } from "@/modules/transactions/queries/ledger";
import type { Person } from "@/modules/users/types/user-list";
import { selectBalanceChecks } from "../api/balance-checks-repo";
import { selectProjectWalletHolders } from "../api/holders-repo";
import { dailyBalances, walletBalances, type BalancePoint } from "../lib/balances";
import { toBalanceCheck } from "../mappers/balance-check";
import type { BalanceCheck } from "../types/balance-check";
import type { WalletBalance } from "../types/wallet";

export interface WalletListItem extends WalletBalance {
  vehicleName: string | null;
  /** Anggota yang boleh mencatat di dompet ini (spec pemegang dompet). */
  holders: Person[];
}

export interface WalletList {
  projectId: string;
  locked: boolean;
  vehicles: Vehicle[];
  /** Semua dompet termasuk yang diarsipkan, urut sortOrder. */
  wallets: WalletListItem[];
}

export const getWalletList = cache(async (db: Db, projectId: string): Promise<WalletList> => {
  const [ledger, holderRows] = await Promise.all([getLedger(db, projectId), selectProjectWalletHolders(db, projectId)]);
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
      holders: holderRows.filter((h) => h.walletId === w.id).map((h) => ({ id: h.userId, name: h.name ?? h.email })),
    })),
  };
});

export interface WalletDetail {
  projectId: string;
  locked: boolean;
  vehicles: Vehicle[];
  wallet: WalletListItem;
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
    balanceHistory: dailyBalances(wallet, ledger.transactions),
    checks: checkRows.map((row) => toBalanceCheck(row, adjustments.get(row.id) ?? null)),
    categories: ledger.categories.filter((c) => !c.archived),
  };
});
