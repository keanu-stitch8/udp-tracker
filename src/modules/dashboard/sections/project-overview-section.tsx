import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ProjectOverviewCard } from "../components/project-overview-card";

export async function ProjectOverviewSection() {
  await connection();
  const project = await getActiveProject(getDb());
  if (!project) redirect("/proyek/baru");
  return <ProjectOverviewCard project={project} />;
}
