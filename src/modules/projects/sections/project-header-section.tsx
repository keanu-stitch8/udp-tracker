import { connection } from "next/server";
import { getDb } from "@/db/client";
import { ProjectHeader } from "../components/project-header";
import { getActiveProject } from "../queries/projects";

export async function ProjectHeaderSection() {
  await connection();
  return <ProjectHeader project={await getActiveProject(getDb())} />;
}
