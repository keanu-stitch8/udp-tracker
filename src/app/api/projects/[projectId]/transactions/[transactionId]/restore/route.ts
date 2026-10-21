import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { restoreTransaction } from "@/modules/transactions/commands/save-transaction";

export const POST = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/transactions/[transactionId]/restore">) => {
  const { projectId, transactionId } = await ctx.params;
  return Response.json(await restoreTransaction(getDb(), projectId, transactionId));
});
