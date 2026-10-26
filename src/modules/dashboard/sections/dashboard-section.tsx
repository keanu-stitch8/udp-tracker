import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { can } from "@/modules/users/lib/access";
import { DashboardSummaryView } from "../components/dashboard-summary";
import { getDashboardSummary } from "../queries/summary";

export async function DashboardSection() {
  await connection();
  const db = getDb();
  const project = await requireActiveProject(db);
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.summary(project.id), await getDashboardSummary(db, project.id, { budgetSecret: can(project.role, "budgetSecret") }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardSummaryView projectId={project.id} />
    </HydrationBoundary>
  );
}
