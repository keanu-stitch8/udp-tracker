import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { deleteTransaction, updateTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionView } from "@/modules/transactions/queries/views";

type Ctx = RouteContext<"/api/projects/[projectId]/transactions/[transactionId]">;

export const GET = projectRoute("view", async (_request, ctx: Ctx) => {
  const { projectId, transactionId } = await ctx.params;
  return Response.json(await getTransactionView(getDb(), projectId, transactionId));
});

export const PATCH = projectRoute("transact", async (request, ctx: Ctx) => {
  const { projectId, transactionId } = await ctx.params;
  return Response.json(await updateTransaction(getDb(), projectId, transactionId, await readJson(request)));
});

export const DELETE = projectRoute("transact", async (_request, ctx: Ctx) => {
  const { projectId, transactionId } = await ctx.params;
  await deleteTransaction(getDb(), projectId, transactionId);
  return new Response(null, { status: 204 });
});
