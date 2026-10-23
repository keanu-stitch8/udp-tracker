import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { startViewAs } from "@/modules/members/commands/view-as";

export const POST = projectRoute("manage", async (_request, ctx: RouteContext<"/api/projects/[projectId]/members/[userId]/view-as">) => {
  const { projectId, userId } = await ctx.params;
  await startViewAs(getDb(), projectId, userId);
  return new Response(null, { status: 204 });
});
