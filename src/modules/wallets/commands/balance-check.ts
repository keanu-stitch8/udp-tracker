import "server-only";
import type { Db } from "@/db/types";
import { ConflictError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { toCategory } from "@/modules/budgets/mappers/category";
import { selectVehicles } from "@/modules/projects/api/vehicles-repo";
import { toVehicle } from "@/modules/projects/mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { insertTransaction, selectTransactions } from "@/modules/transactions/api/transactions-repo";
import { toTransaction } from "@/modules/transactions/mappers/transaction";
import { planTransaction } from "@/modules/transactions/services/transaction-rules";
import type { Transaction } from "@/modules/transactions/types/transaction";
import { insertBalanceCheck } from "../api/balance-checks-repo";
import { selectWallets } from "../api/wallets-repo";
import { adjustmentInput, defaultAdjustmentCategoryId } from "../lib/balance-check";
import { walletBalances } from "../lib/balances";
import { toBalanceCheck } from "../mappers/balance-check";
import { toWallet } from "../mappers/wallet";
import { findBalanceCheckOrThrow } from "../services/balance-checks";
import { findWalletOrThrow } from "../services/wallets";
import type { BalanceCheck } from "../types/balance-check";
import { adjustInputSchema, balanceCheckInputSchema } from "../types/balance-check-input";

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

/** Simpan cek saldo beserta snapshot saldo aplikasi s/d tanggal cek. */
export async function createBalanceCheck(db: Db, projectId: string, walletId: string, input: unknown): Promise<BalanceCheck> {
  await editableProject(db, projectId);
  const wallet = toWallet(await findWalletOrThrow(db, projectId, walletId));
  const v = parseOrThrow(balanceCheckInputSchema, input);
  const transactions = (await selectTransactions(db, projectId)).map(toTransaction);
  const computedBalance = walletBalances([wallet], transactions, v.date).get(wallet.id) ?? wallet.openingBalance;
  const row = await insertBalanceCheck(db, { walletId: wallet.id, date: v.date, actualBalance: v.actualBalance, computedBalance, note: v.note });
  return toBalanceCheck(row, null);
}

/** "Catat selisih" (spec §3.3): satu transaksi penyesuaian aktif per cek saldo. */
export async function adjustBalanceCheck(db: Db, projectId: string, checkId: string, input: unknown): Promise<Transaction> {
  await editableProject(db, projectId);
  const check = await findBalanceCheckOrThrow(db, projectId, checkId);
  const difference = check.actualBalance - check.computedBalance;
  if (difference === 0) throw new ConflictError("Saldo sudah cocok, tidak ada selisih untuk dicatat.");

  const [walletRows, categoryRows, vehicleRows, transactionRows] = await Promise.all([
    selectWallets(db, projectId),
    selectCategories(db, projectId),
    selectVehicles(db, projectId),
    selectTransactions(db, projectId),
  ]);
  if (transactionRows.some((t) => t.balanceCheckId === check.id)) throw new ConflictError("Selisih cek saldo ini sudah dicatat.");

  const wallets = walletRows.map(toWallet);
  const categories = categoryRows.map(toCategory);
  const wallet = wallets.find((w) => w.id === check.walletId)!;
  const { categoryId } = parseOrThrow(adjustInputSchema, input);
  const category = categories.find((c) => c.id === (categoryId ?? defaultAdjustmentCategoryId(difference, wallet, categories)));
  if (!category) throw new ValidationError({ categoryId: ["Pilih kategori."] });

  const values = planTransaction(adjustmentInput({ date: check.date, difference }, wallet, category), {
    wallets,
    categories,
    vehicles: vehicleRows.map(toVehicle),
  });
  return toTransaction(await insertTransaction(db, { ...values, projectId, balanceCheckId: check.id }));
}
