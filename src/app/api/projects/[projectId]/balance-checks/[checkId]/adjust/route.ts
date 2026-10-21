import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { adjustBalanceCheck } from "@/modules/wallets/commands/balance-check";

export const POST = route(async (request, ctx: RouteContext<"/api/projects/[projectId]/balance-checks/[checkId]/adjust">) => {
  const { projectId, checkId } = await ctx.params;
  return Response.json(await adjustBalanceCheck(getDb(), projectId, checkId, await readJson(request)), { status: 201 });
});
