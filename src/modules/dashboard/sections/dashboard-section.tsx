import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { DashboardSummaryView } from "../components/dashboard-summary";
import { getDashboardSummary } from "../queries/summary";

export async function DashboardSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.summary(project.id), await getDashboardSummary(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardSummaryView projectId={project.id} />
    </HydrationBoundary>
  );
}
