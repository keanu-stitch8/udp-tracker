import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisions } from "@/modules/divisions/queries/divisions";
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
  const [settings, divisions] = await Promise.all([getProjectSettings(db, project.id), listDivisions(db)]);
  queryClient.setQueryData(ledgerKeys.settings(project.id), settings);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectSettingsPanel projectId={project.id} />
    </HydrationBoundary>
  );
}
