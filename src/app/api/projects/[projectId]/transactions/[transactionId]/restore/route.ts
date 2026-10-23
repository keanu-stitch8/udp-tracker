import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { restoreTransaction } from "@/modules/transactions/commands/save-transaction";

export const POST = projectRoute("transact", async (_request, ctx: RouteContext<"/api/projects/[projectId]/transactions/[transactionId]/restore">, { user }) => {
  const { projectId, transactionId } = await ctx.params;
  return Response.json(await restoreTransaction(getDb(), projectId, transactionId, user.id));
});
