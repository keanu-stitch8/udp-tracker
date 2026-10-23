import { getDb } from "@/db/client";
import { projectRoute } from "@/lib/http";
import { getTransactionReference } from "@/modules/transactions/queries/views";

export const GET = projectRoute("view", async (_request, ctx: RouteContext<"/api/projects/[projectId]/reference">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getTransactionReference(getDb(), projectId));
});
