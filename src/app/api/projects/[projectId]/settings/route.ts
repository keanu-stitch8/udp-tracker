import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { getProjectSettings } from "@/modules/projects/queries/project-settings";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/settings">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getProjectSettings(getDb(), projectId));
});
