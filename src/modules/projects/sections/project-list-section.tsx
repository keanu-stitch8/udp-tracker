import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisionsFor } from "@/modules/divisions/queries/divisions";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ProjectList } from "../components/project-list";
import { projectKeys } from "../hooks/keys";
import { canCreateProjects, getActiveProject, listProjectsFor } from "../queries/projects";

export async function ProjectListSection() {
  await connection();
  const db = getDb();
  const user = await requireCurrentUser(db);
  const [projects, divisions, active, canCreate] = await Promise.all([listProjectsFor(db, user), listDivisionsFor(db, user), getActiveProject(db), canCreateProjects(db, user)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(projectKeys.list(), projects);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectList activeProjectId={active?.id ?? null} canCreate={canCreate} />
    </HydrationBoundary>
  );
}
