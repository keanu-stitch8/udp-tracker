import { connection } from "next/server";
import { getDb } from "@/db/client";
import { selectDivision } from "@/modules/divisions/api/divisions-repo";
import { ProjectHeader } from "../components/project-header";
import { getActiveProject } from "../queries/projects";

export async function ProjectHeaderSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  const division = project ? await selectDivision(db, project.divisionId) : undefined;
  return <ProjectHeader project={project} divisionName={division?.name ?? null} />;
}
