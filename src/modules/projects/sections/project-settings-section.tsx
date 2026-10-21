import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { ProjectSettingsPanel } from "../components/project-settings";
import { getProjectSettings } from "../queries/project-settings";
import { getActiveProject } from "../queries/projects";

export async function ProjectSettingsSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.settings(project.id), await getProjectSettings(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectSettingsPanel projectId={project.id} />
    </HydrationBoundary>
  );
}
