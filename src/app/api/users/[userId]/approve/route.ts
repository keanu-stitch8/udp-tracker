import { getDb } from "@/db/client";
import { rootRoute } from "@/lib/http";
import { approveUser } from "@/modules/users/commands/manage-users";

/** Setujui akun menunggu / ditolak (aktif tanpa penugasan). */
export const POST = rootRoute(async (_request, ctx: RouteContext<"/api/users/[userId]/approve">) => {
  await approveUser(getDb(), (await ctx.params).userId);
  return new Response(null, { status: 204 });
});
