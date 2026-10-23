import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { setWalletHolders } from "@/modules/wallets/commands/wallet-holders";

export const PUT = projectRoute("manage", async (request, ctx: RouteContext<"/api/projects/[projectId]/wallets/[walletId]/holders">) => {
  const { projectId, walletId } = await ctx.params;
  await setWalletHolders(getDb(), projectId, walletId, await readJson(request));
  return new Response(null, { status: 204 });
});
