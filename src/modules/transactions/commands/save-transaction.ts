import "server-only";
import type { Db } from "@/db/types";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { toCategory } from "@/modules/budgets/mappers/category";
import { selectVehicles } from "@/modules/projects/api/vehicles-repo";
import { toVehicle } from "@/modules/projects/mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { selectWallets } from "@/modules/wallets/api/wallets-repo";
import { toWallet } from "@/modules/wallets/mappers/wallet";
import { insertTransaction, updateTransactionRow } from "../api/transactions-repo";
import { toTransaction } from "../mappers/transaction";
import { planTransaction, type TransactionRefs } from "../services/transaction-rules";
import { findTransactionOrThrow } from "../services/transactions";
import type { Transaction } from "../types/transaction";

async function loadRefs(db: Db, projectId: string): Promise<TransactionRefs> {
  const [wallets, categories, vehicles] = await Promise.all([selectWallets(db, projectId), selectCategories(db, projectId), selectVehicles(db, projectId)]);
  return { wallets: wallets.map(toWallet), categories: categories.map(toCategory), vehicles: vehicles.map(toVehicle) };
}

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

export async function createTransaction(db: Db, projectId: string, input: unknown): Promise<Transaction> {
  await editableProject(db, projectId);
  const values = planTransaction(input, await loadRefs(db, projectId));
  return toTransaction(await insertTransaction(db, { ...values, projectId }));
}

export async function updateTransaction(db: Db, projectId: string, id: string, input: unknown): Promise<Transaction> {
  await editableProject(db, projectId);
  await findTransactionOrThrow(db, projectId, id);
  const values = planTransaction(input, await loadRefs(db, projectId));
  return toTransaction(await updateTransactionRow(db, id, values));
}

/** Hapus = soft delete (spec §3.4); bisa diurungkan. */
export async function deleteTransaction(db: Db, projectId: string, id: string): Promise<void> {
  await editableProject(db, projectId);
  await findTransactionOrThrow(db, projectId, id);
  await updateTransactionRow(db, id, { deletedAt: new Date() });
}

export async function restoreTransaction(db: Db, projectId: string, id: string): Promise<Transaction> {
  await editableProject(db, projectId);
  await findTransactionOrThrow(db, projectId, id, { includeDeleted: true });
  return toTransaction(await updateTransactionRow(db, id, { deletedAt: null }));
}
