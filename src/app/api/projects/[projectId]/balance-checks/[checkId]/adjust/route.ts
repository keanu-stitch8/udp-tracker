import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { adjustBalanceCheck } from "@/modules/wallets/commands/balance-check";

export const POST = projectRoute("transact", async (request, ctx: RouteContext<"/api/projects/[projectId]/balance-checks/[checkId]/adjust">, { user }) => {
  const { projectId, checkId } = await ctx.params;
  return Response.json(await adjustBalanceCheck(getDb(), projectId, checkId, await readJson(request), user.id), { status: 201 });
});
