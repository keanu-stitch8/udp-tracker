import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { createBalanceCheck } from "@/modules/wallets/commands/balance-check";
import { getWalletDetail } from "@/modules/wallets/queries/wallets";
import { ledgerActor } from "@/modules/wallets/services/wallet-scope";

type Ctx = RouteContext<"/api/projects/[projectId]/wallets/[walletId]/balance-checks">;

export const GET = projectRoute("view", async (_request, ctx: Ctx) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json((await getWalletDetail(getDb(), projectId, walletId)).checks);
});

export const POST = projectRoute("transact", async (request, ctx: Ctx, access) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json(await createBalanceCheck(getDb(), projectId, walletId, await readJson(request), await ledgerActor(getDb(), access)), { status: 201 });
});
