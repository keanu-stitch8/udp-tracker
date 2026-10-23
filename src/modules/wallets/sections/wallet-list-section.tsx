import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { can } from "@/modules/users/lib/access";
import { WalletList } from "../components/wallet-list";
import { getWalletList } from "../queries/wallets";

export async function WalletListSection() {
  await connection();
  const db = getDb();
  const project = await requireActiveProject(db);
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.wallets(project.id), await getWalletList(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WalletList projectId={project.id} canManage={can(project.role, "manage")} />
    </HydrationBoundary>
  );
}
