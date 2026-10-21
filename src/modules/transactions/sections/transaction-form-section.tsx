import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { safeNextPath } from "@/modules/auth/lib/safe-next";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { isIsoDate, nowTimeWib, todayWib } from "@/modules/shared/lib/date";
import { TransactionForm } from "../components/transaction-form";
import { getTransactionReference, getTransactionView } from "../queries/views";
import type { TransactionView } from "../types/transaction";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function TransactionFormSection({ searchParams, transactionId }: { searchParams: SearchParams; transactionId?: Promise<string> }) {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");

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
