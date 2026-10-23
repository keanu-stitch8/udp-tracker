import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { safeNextPath } from "@/modules/auth/lib/safe-next";
import { requireActiveProject } from "@/modules/projects/queries/projects";
import { isIsoDate, nowTimeWib, todayWib } from "@/modules/shared/lib/date";
import { canEditTransaction, canTransact, NO_WALLET_MESSAGE, OUT_OF_SCOPE_MESSAGE } from "@/modules/wallets/lib/scope";
import { NoAccessNotice } from "../components/no-access-notice";
import { TransactionForm } from "../components/transaction-form";
import { getTransactionReference, getTransactionView } from "../queries/views";
import type { TransactionView } from "../types/transaction";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function TransactionFormSection({ searchParams, transactionId }: { searchParams: SearchParams; transactionId?: Promise<string> }) {
  await connection();
  const db = getDb();
  const project = await requireActiveProject(db);

  const params = await searchParams;
  const requestedDate = single(params.tanggal);
  const returnTo = safeNextPath(single(params.dari) ?? (transactionId ? "/transaksi" : "/"));
  const reference = await getTransactionReference(db, project.id);

  let initial: TransactionView | undefined;
  if (transactionId) {
    try {
      initial = await getTransactionView(db, project.id, await transactionId);
    } catch (error) {
      if (error instanceof NotFoundError) notFound();
      throw error;
    }
  }

  // Anggota tanpa dompet / transaksi di dompet orang lain: tanpa form (spec pemegang dompet).
  if (!canTransact(project.walletScope)) return <NoAccessNotice message={NO_WALLET_MESSAGE} returnTo={returnTo} />;
  if (initial && !canEditTransaction(project.walletScope, initial)) return <NoAccessNotice message={OUT_OF_SCOPE_MESSAGE} returnTo={returnTo} />;

  return (
    <TransactionForm
      reference={reference}
      initial={initial}
      returnTo={returnTo}
      defaultDate={requestedDate && isIsoDate(requestedDate) ? requestedDate : todayWib()}
      defaultTime={nowTimeWib()}
    />
  );
}
