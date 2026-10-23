import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getCalendarMonth } from "@/modules/calendar/queries/calendar";

export const GET = projectRoute("view", async (request, ctx: RouteContext<"/api/projects/[projectId]/calendar">) => {
  const { projectId } = await ctx.params;
  const month = new URL(request.url).searchParams.get("month") ?? "";
  return Response.json(await getCalendarMonth(getDb(), projectId, month));
});
