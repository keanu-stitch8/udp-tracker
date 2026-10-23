import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getDashboardSummary } from "@/modules/dashboard/queries/summary";

export const GET = projectRoute("view", async (_request, ctx: RouteContext<"/api/projects/[projectId]/summary">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getDashboardSummary(getDb(), projectId));
});
