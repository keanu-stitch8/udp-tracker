import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { toCategory } from "@/modules/budgets/mappers/category";
import { selectVehicles } from "@/modules/projects/api/vehicles-repo";
import { toVehicle } from "@/modules/projects/mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { deleteReceipts } from "@/modules/receipts/api/blob";
import { snapshotOf } from "@/modules/notifications/lib/activity";
import { recordActivities } from "@/modules/notifications/services/activities";
import { selectPathnamesInUse, selectTransactionAttachments } from "@/modules/receipts/api/attachments-repo";
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

const receiptCount = async (db: Db, transactionId: string) => (await selectTransactionAttachments(db, transactionId)).length;

// `actor` = jejak penginput (spec akses §7) + cakupan dompet (spec pemegang dompet); null hanya untuk tes.

export async function createTransaction(db: Db, projectId: string, input: unknown, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  const refs = await loadRefs(db, projectId);
  const values = planTransaction(input, refs);
  assertWalletInScope(actor, values.walletId);
  const attachments = planAttachments(input, projectId);
  return db.transaction(async (tx) => {
    const row = await insertTransaction(tx, { ...values, projectId, createdBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null });
    if (attachments) await syncAttachments(tx, row.id, attachments);
    const saved = toTransaction(row);
    await recordActivities(tx, projectId, actor?.userId ?? null, [{ kind: "transaction_created", transactionId: saved.id, before: null, after: snapshotOf(saved, refs, attachments?.length ?? 0) }]);
    return saved;
  });
}

const MAX_BATCH = 50;
const batchSchema = z.object({
  transactions: z.array(z.unknown(), "Daftar transaksi wajib diisi.").min(1, "Pilih minimal satu transaksi.").max(MAX_BATCH, `Maksimal ${MAX_BATCH} transaksi sekali simpan.`),
});

/** Error validasi satu baris → field diberi awalan `transactions.N.` agar baris yang salah terlihat. */
function inRow<T>(index: number, plan: () => T): T {
  try {
    return plan();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    throw new ValidationError(Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [`transactions.${index}.${field}`, messages])));
  }
}

/** Banyak transaksi sekaligus (impor riwayat tol): semua tersimpan atau tidak sama sekali. */
export async function createTransactions(db: Db, projectId: string, input: unknown, actor: LedgerActor | null): Promise<Transaction[]> {
  await editableProject(db, projectId);
  const { transactions: items } = parseOrThrow(batchSchema, input);
  const refs = await loadRefs(db, projectId);
  const planned = items.map((item, index) =>
    inRow(index, () => {
      const values = planTransaction(item, refs);
      assertWalletInScope(actor, values.walletId);
      return { values, attachments: planAttachments(item, projectId) };
    }),
  );
  return db.transaction(async (tx) => {
    const saved: Transaction[] = [];
    for (const { values, attachments } of planned) {
      const row = await insertTransaction(tx, { ...values, projectId, createdBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null });
      if (attachments) await syncAttachments(tx, row.id, attachments);
      saved.push(toTransaction(row));
    }
    await recordActivities(
      tx,
      projectId,
      actor?.userId ?? null,
      saved.map((t, index) => ({ kind: "transaction_created" as const, transactionId: t.id, before: null, after: snapshotOf(t, refs, planned[index].attachments?.length ?? 0) })),
    );
    return saved;
  });
}

export async function updateTransaction(db: Db, projectId: string, id: string, input: unknown, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  const existing = await findTransactionOrThrow(db, projectId, id);
  const refs = await loadRefs(db, projectId);
  const values = planTransaction(input, refs, existing);
  assertWalletInScope(actor, existing.walletId, values.walletId);
  const attachments = planAttachments(input, projectId);
  const receiptsBefore = await receiptCount(db, id);
  const { row, removed } = await db.transaction(async (tx) => {
    const row = await updateTransactionRow(tx, id, { ...values, updatedBy: actor?.userId ?? null });
    const removed = attachments ? await syncAttachments(tx, id, attachments) : [];
    const after = snapshotOf(toTransaction(row), refs, attachments?.length ?? receiptsBefore);
    await recordActivities(tx, projectId, actor?.userId ?? null, [{ kind: "transaction_updated", transactionId: id, before: snapshotOf(existing, refs, receiptsBefore), after }]);
    return { row, removed };
  });
  // Setelah commit: file Blob dihapus bila tidak ada lagi baris lampiran yang memakainya (riwayat tol: satu file, banyak transaksi).
  const inUse = await selectPathnamesInUse(db, removed);
  const orphaned = removed.filter((pathname) => !inUse.has(pathname));
  if (orphaned.length) await deleteReceipts(orphaned);
  return toTransaction(row);
}

/** Hapus = soft delete (spec §3.4); bisa diurungkan. */
export async function deleteTransaction(db: Db, projectId: string, id: string, actor: LedgerActor | null): Promise<void> {
  await editableProject(db, projectId);
  const existing = await findTransactionOrThrow(db, projectId, id);
  assertWalletInScope(actor, existing.walletId);
  const before = snapshotOf(existing, await loadRefs(db, projectId), await receiptCount(db, id));
  await db.transaction(async (tx) => {
    await updateTransactionRow(tx, id, { deletedAt: new Date(), updatedBy: actor?.userId ?? null });
    await recordActivities(tx, projectId, actor?.userId ?? null, [{ kind: "transaction_deleted", transactionId: id, before, after: null }]);
  });
}

export async function restoreTransaction(db: Db, projectId: string, id: string, actor: LedgerActor | null): Promise<Transaction> {
  await editableProject(db, projectId);
  const existing = await findTransactionOrThrow(db, projectId, id, { includeDeleted: true });
  assertWalletInScope(actor, existing.walletId);
  const after = snapshotOf(existing, await loadRefs(db, projectId), await receiptCount(db, id));
  return db.transaction(async (tx) => {
    const row = await updateTransactionRow(tx, id, { deletedAt: null, updatedBy: actor?.userId ?? null });
    await recordActivities(tx, projectId, actor?.userId ?? null, [{ kind: "transaction_restored", transactionId: id, before: null, after }]);
    return toTransaction(row);
  });
}
