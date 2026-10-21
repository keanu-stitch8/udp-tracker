import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { WalletList } from "../components/wallet-list";
import { getWalletList } from "../queries/wallets";

export async function WalletListSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.wallets(project.id), await getWalletList(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WalletList projectId={project.id} />
    </HydrationBoundary>
  );
}
