import "server-only";
import type { Db } from "@/db/types";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { toCategory } from "@/modules/budgets/mappers/category";
import { selectVehicles } from "@/modules/projects/api/vehicles-repo";
import { toVehicle } from "@/modules/projects/mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { deleteReceipts } from "@/modules/receipts/api/blob";
import { planAttachments, syncAttachments } from "@/modules/receipts/services/attachments";
import { selectWallets } from "@/modules/wallets/api/wallets-repo";
import { toWallet } from "@/modules/wallets/mappers/wallet";
import { assertWalletInScope, type LedgerActor } from "@/modules/wallets/services/wallet-scope";
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

// `actor` = jejak penginput (spec akses §7) + cakupan dompet (spec pemegang dompet); null hanya untuk tes.

export async function createTransaction(db: Db, projectId: string, input: unknown, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  const values = planTransaction(input, await loadRefs(db, projectId));
  assertWalletInScope(actor, values.walletId);
  const attachments = planAttachments(input, projectId);
  return db.transaction(async (tx) => {
    const row = await insertTransaction(tx, { ...values, projectId, createdBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null });
    if (attachments) await syncAttachments(tx, row.id, attachments);
    return toTransaction(row);
  });
}

export async function updateTransaction(db: Db, projectId: string, id: string, input: unknown, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  const existing = await findTransactionOrThrow(db, projectId, id);
  const values = planTransaction(input, await loadRefs(db, projectId), existing);
  assertWalletInScope(actor, existing.walletId, values.walletId);
  const attachments = planAttachments(input, projectId);
  const { row, removed } = await db.transaction(async (tx) => ({
    row: await updateTransactionRow(tx, id, { ...values, updatedBy: actor?.userId ?? null }),
    removed: attachments ? await syncAttachments(tx, id, attachments) : [],
  }));
  // Setelah commit: file Blob baru dihapus bila baris DB-nya benar-benar sudah hilang.
  if (removed.length) await deleteReceipts(removed);
  return toTransaction(row);
}

/** Hapus = soft delete (spec §3.4); bisa diurungkan. */
export async function deleteTransaction(db: Db, projectId: string, id: string, actor: LedgerActor | null): Promise<void> {
  await editableProject(db, projectId);
  assertWalletInScope(actor, (await findTransactionOrThrow(db, projectId, id)).walletId);
  await updateTransactionRow(db, id, { deletedAt: new Date(), updatedBy: actor?.userId ?? null });
}

export async function restoreTransaction(db: Db, projectId: string, id: string, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  assertWalletInScope(actor, (await findTransactionOrThrow(db, projectId, id, { includeDeleted: true })).walletId);
  return toTransaction(await updateTransactionRow(db, id, { deletedAt: null, updatedBy: actor?.userId ?? null }));
}
