import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getProjectSettings } from "@/modules/projects/queries/project-settings";

export const GET = projectRoute("manage", async (_request, ctx: RouteContext<"/api/projects/[projectId]/settings">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getProjectSettings(getDb(), projectId));
});
