import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { ProjectList } from "../components/project-list";
import { projectKeys } from "../hooks/keys";
import { getActiveProject, listProjects } from "../queries/projects";

export async function ProjectListSection() {
  await connection();
  const db = getDb();
  const [projects, active] = await Promise.all([listProjects(db), getActiveProject(db)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(projectKeys.list(), projects);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectList activeProjectId={active?.id ?? null} />
    </HydrationBoundary>
  );
}
