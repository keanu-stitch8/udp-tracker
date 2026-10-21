import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { updateWallet } from "@/modules/wallets/commands/save-wallet";
import { getWalletDetail } from "@/modules/wallets/queries/wallets";

type Ctx = RouteContext<"/api/projects/[projectId]/wallets/[walletId]">;

export const GET = route(async (_request, ctx: Ctx) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json(await getWalletDetail(getDb(), projectId, walletId));
});

export const PATCH = route(async (request, ctx: Ctx) => {
  const { projectId, walletId } = await ctx.params;
  return Response.json(await updateWallet(getDb(), projectId, walletId, await readJson(request)));
});
