import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { CategorySettingsList } from "../components/category-settings";
import { getCategorySettings } from "../queries/category-settings";

export async function CategorySettingsSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.categories(project.id), await getCategorySettings(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CategorySettingsList projectId={project.id} />
    </HydrationBoundary>
  );
}
