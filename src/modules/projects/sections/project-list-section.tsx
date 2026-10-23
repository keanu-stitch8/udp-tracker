import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisions } from "@/modules/divisions/queries/divisions";
import { ProjectList } from "../components/project-list";
import { projectKeys } from "../hooks/keys";
import { getActiveProject, listProjects } from "../queries/projects";

export async function ProjectListSection() {
  await connection();
  const db = getDb();
  const [projects, divisions, active] = await Promise.all([listProjects(db), listDivisions(db), getActiveProject(db)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(projectKeys.list(), projects);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectList activeProjectId={active?.id ?? null} />
    </HydrationBoundary>
  );
}
