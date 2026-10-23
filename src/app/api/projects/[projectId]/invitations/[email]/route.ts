import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { cancelInvitation } from "@/modules/members/commands/members";

export const DELETE = projectRoute("manage", async (_request, ctx: RouteContext<"/api/projects/[projectId]/invitations/[email]">, { projectId }) => {
  await cancelInvitation(getDb(), projectId, decodeURIComponent((await ctx.params).email));
  return new Response(null, { status: 204 });
});
