import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { deleteProject } from "@/modules/projects/commands/delete-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { getProjectDetail } from "@/modules/projects/queries/projects";

type Ctx = RouteContext<"/api/projects/[projectId]">;

export const GET = projectRoute("view", async (_request, _ctx: Ctx, { projectId }) => Response.json(await getProjectDetail(getDb(), projectId)));

export const PATCH = projectRoute("manage", async (request, _ctx: Ctx, { user, projectId }) => Response.json(await updateProject(getDb(), user, projectId, await readJson(request))));

/** Body: { name } — ketik ulang nama proyek (lihat deleteProject). */
export const DELETE = projectRoute("manage", async (request, _ctx: Ctx, { projectId }) => {
  await deleteProject(getDb(), projectId, await readJson(request));
  return new Response(null, { status: 204 });
});
