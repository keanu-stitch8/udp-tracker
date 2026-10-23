import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisionsFor } from "@/modules/divisions/queries/divisions";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ProjectSettingsPanel } from "../components/project-settings";
import { getProjectSettings } from "../queries/project-settings";
import { requireManagedProject } from "../queries/projects";

export async function ProjectSettingsSection() {
  await connection();
  const db = getDb();
  const project = await requireManagedProject(db);
  const queryClient = new QueryClient();
  const [settings, divisions] = await Promise.all([getProjectSettings(db, project.id), listDivisionsFor(db, await requireCurrentUser(db))]);
  queryClient.setQueryData(ledgerKeys.settings(project.id), settings);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectSettingsPanel projectId={project.id} />
    </HydrationBoundary>
  );
}
