import { getDb } from "@/db/client";
import { env } from "@/lib/env";
import { clientIp, readJson, route } from "@/lib/http";
import { deleteProject } from "@/modules/projects/commands/delete-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { getProjectDetail } from "@/modules/projects/queries/projects";

type Ctx = RouteContext<"/api/projects/[projectId]">;

export const GET = route(async (_request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await getProjectDetail(getDb(), projectId));
});

export const PATCH = route(async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await updateProject(getDb(), projectId, await readJson(request)));
});

/** Body: { password } — password admin wajib (lihat deleteProject). */
export const DELETE = route(async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  await deleteProject(getDb(), projectId, await readJson(request), { ip: clientIp(request), passwordHash: env().APP_PASSWORD_HASH });
  return new Response(null, { status: 204 });
});
