import { getDb } from "@/db/client";
import { readJson, rootRoute } from "@/lib/http";
import { setUserRoot } from "@/modules/users/commands/manage-users";

/** Body: { isRoot }. */
export const PUT = rootRoute(async (request, ctx: RouteContext<"/api/users/[userId]/root">) => {
  await setUserRoot(getDb(), (await ctx.params).userId, await readJson(request));
  return new Response(null, { status: 204 });
});
