import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { markSeen } from "@/modules/notifications/commands/mark-seen";

/** Tandai satu grup terbaca untuk user ini (`{ group }`). */
export const POST = projectRoute("view", async (request, ctx: RouteContext<"/api/projects/[projectId]/notifications/seen">, { user }) => {
  const { projectId } = await ctx.params;
  await markSeen(getDb(), { userId: user.id, projectId }, await readJson(request));
  return new Response(null, { status: 204 });
});
