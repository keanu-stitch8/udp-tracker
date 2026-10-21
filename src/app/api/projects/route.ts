import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { activateProject } from "@/modules/projects/commands/activate-project";
import { createProject } from "@/modules/projects/commands/create-project";
import { listProjects } from "@/modules/projects/queries/projects";

export const GET = route(async () => Response.json(await listProjects(getDb())));

export const POST = route(async (request) => {
  const db = getDb();
  const project = await createProject(db, await readJson(request));
  await activateProject(db, project.id);
  return Response.json(project, { status: 201 });
});
