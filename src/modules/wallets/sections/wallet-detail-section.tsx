import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { todayWib } from "@/modules/shared/lib/date";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { WalletDetailPanel } from "../components/wallet-detail";
import { getWalletDetail, type WalletDetail } from "../queries/wallets";

export async function WalletDetailSection({ walletId }: { walletId: Promise<string> }) {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const id = await walletId;
  let detail: WalletDetail;
  try {
    detail = await getWalletDetail(db, project.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.wallet(project.id, id), detail);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WalletDetailPanel projectId={project.id} walletId={id} today={todayWib()} />
    </HydrationBoundary>
  );
}
