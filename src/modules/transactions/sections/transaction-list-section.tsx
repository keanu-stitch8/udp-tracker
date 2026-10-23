import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireActiveProject } from "@/modules/projects/queries/projects";
import { TransactionList } from "../components/transaction-list";
import { ledgerKeys } from "../hooks/keys";
import { getTransactionReference, listTransactionViews } from "../queries/views";

export async function TransactionListSection() {
  await connection();
  const db = getDb();
  const project = await requireActiveProject(db);
  const [views, reference] = await Promise.all([listTransactionViews(db, project.id), getTransactionReference(db, project.id)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.transactions(project.id), views);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionList reference={reference} />
    </HydrationBoundary>
  );
}
