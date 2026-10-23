import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { removeMember } from "@/modules/members/commands/members";

export const DELETE = projectRoute("manage", async (_request, ctx: RouteContext<"/api/projects/[projectId]/members/[userId]">, { projectId }) => {
  await removeMember(getDb(), projectId, (await ctx.params).userId);
  return new Response(null, { status: 204 });
});
