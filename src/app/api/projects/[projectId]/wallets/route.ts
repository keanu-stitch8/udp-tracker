import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { createWallet } from "@/modules/wallets/commands/save-wallet";
import { getWalletList } from "@/modules/wallets/queries/wallets";

type Ctx = RouteContext<"/api/projects/[projectId]/wallets">;

export const GET = projectRoute("view", async (_request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await getWalletList(getDb(), projectId));
});

export const POST = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await createWallet(getDb(), projectId, await readJson(request)), { status: 201 });
});
