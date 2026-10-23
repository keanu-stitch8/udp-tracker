import { getDb } from "@/db/client";
import { rootRoute } from "@/lib/http";
import { rejectUser } from "@/modules/users/commands/manage-users";

/** Tolak akun menunggu / cabut akses akun aktif. */
export const POST = rootRoute(async (_request, ctx: RouteContext<"/api/users/[userId]/reject">) => {
  const { userId } = await ctx.params;
  await rejectUser(getDb(), userId);
  return new Response(null, { status: 204 });
});
