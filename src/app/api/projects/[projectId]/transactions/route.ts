import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { createTransaction } from "@/modules/transactions/commands/save-transaction";
import { listTransactionViews } from "@/modules/transactions/queries/views";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/transactions">) => {
  const { projectId } = await ctx.params;
  return Response.json(await listTransactionViews(getDb(), projectId));
});

export const POST = route(async (request, ctx: RouteContext<"/api/projects/[projectId]/transactions">) => {
  const { projectId } = await ctx.params;
  return Response.json(await createTransaction(getDb(), projectId, await readJson(request)), { status: 201 });
});
