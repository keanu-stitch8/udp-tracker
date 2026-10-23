import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { activateProject } from "@/modules/projects/commands/activate-project";
import { createProject } from "@/modules/projects/commands/create-project";
import { listProjectsFor } from "@/modules/projects/queries/projects";

export const GET = route(async (_request, _ctx, { user }) => Response.json(await listProjectsFor(getDb(), user)));

/** Root: divisi mana pun; PM: divisinya (dicek createProject). */
export const POST = route(async (request, _ctx, { user }) => {
  const db = getDb();
  const project = await createProject(db, user, await readJson(request));
  await activateProject(db, project.id);
  return Response.json(project, { status: 201 });
});
