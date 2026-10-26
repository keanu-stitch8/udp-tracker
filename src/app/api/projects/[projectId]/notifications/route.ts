import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { groupFromSlug } from "@/modules/notifications/lib/notifications";
import { getNotifications } from "@/modules/notifications/queries/notifications";
import { walletScope } from "@/modules/wallets/services/wallet-scope";

/** `?grup=slug` = satu grup (halaman Notifikasi); `?limit=` 1–100, bawaan 5 (popover). */
export const GET = projectRoute("view", async (request, ctx: RouteContext<"/api/projects/[projectId]/notifications">, { user, role }) => {
  const { projectId } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const limit = Math.min(Math.max(Number(params.get("limit")) || 5, 1), 100);
  const scope = await walletScope(getDb(), role, user.id, projectId);
  return Response.json(await getNotifications(getDb(), { projectId, user, role, scope }, { group: groupFromSlug(params.get("grup")), limit }));
});
