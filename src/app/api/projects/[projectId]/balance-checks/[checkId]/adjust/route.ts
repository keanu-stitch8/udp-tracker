import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { adjustBalanceCheck } from "@/modules/wallets/commands/balance-check";
import { ledgerActor } from "@/modules/wallets/services/wallet-scope";

export const POST = projectRoute("transact", async (request, ctx: RouteContext<"/api/projects/[projectId]/balance-checks/[checkId]/adjust">, access) => {
  const { projectId, checkId } = await ctx.params;
  return Response.json(await adjustBalanceCheck(getDb(), projectId, checkId, await readJson(request), await ledgerActor(getDb(), access)), { status: 201 });
});
