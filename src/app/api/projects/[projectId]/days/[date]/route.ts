import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { getDayDetail } from "@/modules/calendar/queries/calendar";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/days/[date]">) => {
  const { projectId, date } = await ctx.params;
  return Response.json(await getDayDetail(getDb(), projectId, date));
});
