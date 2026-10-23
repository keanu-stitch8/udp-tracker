import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { updateWallet } from "@/modules/wallets/commands/save-wallet";
import { getWalletDetail } from "@/modules/wallets/queries/wallets";

type Ctx = RouteContext<"/api/projects/[projectId]/wallets/[walletId]">;

export const GET = projectRoute("view", async (_request, ctx: Ctx) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json(await getWalletDetail(getDb(), projectId, walletId));
});

export const PATCH = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json(await updateWallet(getDb(), projectId, walletId, await readJson(request)));
});
