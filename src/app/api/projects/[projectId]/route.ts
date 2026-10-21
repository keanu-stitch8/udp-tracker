import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { updateProject } from "@/modules/projects/commands/update-project";
import { getProjectDetail } from "@/modules/projects/queries/projects";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getProjectDetail(getDb(), projectId));
});

export const PATCH = route(async (request, ctx: RouteContext<"/api/projects/[projectId]">) => {
  const { projectId } = await ctx.params;
  return Response.json(await updateProject(getDb(), projectId, await readJson(request)));
});
