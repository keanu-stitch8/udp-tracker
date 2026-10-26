import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getDashboardSummary } from "@/modules/dashboard/queries/summary";
import { can } from "@/modules/users/lib/access";

export const GET = projectRoute("view", async (_request, ctx: RouteContext<"/api/projects/[projectId]/summary">, { role }) => {
  const { projectId } = await ctx.params;
  return Response.json(await getDashboardSummary(getDb(), projectId, { budgetSecret: can(role, "budgetSecret") }));
});
