import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { selectTransaction, type TransactionRow } from "../api/transactions-repo";

/** Transaksi milik proyek. Default hanya yang aktif; `includeDeleted` untuk urungkan hapus. */
export async function findTransactionOrThrow(db: Db, projectId: string, id: string, options: { includeDeleted?: boolean } = {}): Promise<TransactionRow> {
  const row = z.uuid().safeParse(id).success ? await selectTransaction(db, projectId, id) : undefined;
  if (!row || (row.deletedAt && !options.includeDeleted)) throw new NotFoundError("Transaksi tidak ditemukan.");
  return row;
}
