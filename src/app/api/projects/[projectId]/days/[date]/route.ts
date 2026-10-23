import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getDayDetail } from "@/modules/calendar/queries/calendar";
import { can } from "@/modules/users/lib/access";

export const GET = projectRoute("view", async (_request, ctx: RouteContext<"/api/projects/[projectId]/days/[date]">, { role }) => {
  const { projectId, date } = await ctx.params;
  return Response.json(await getDayDetail(getDb(), projectId, date, { budgetSecret: can(role, "budgetSecret") }));
});
