import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { BudgetSettingsList } from "../components/budget-settings";
import { getBudgetSettings } from "../queries/budget-settings";

export async function BudgetSettingsSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.budgets(project.id), await getBudgetSettings(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BudgetSettingsList projectId={project.id} />
    </HydrationBoundary>
  );
}
