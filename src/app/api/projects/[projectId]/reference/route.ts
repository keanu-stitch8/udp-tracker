import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { getTransactionReference } from "@/modules/transactions/queries/views";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/reference">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getTransactionReference(getDb(), projectId));
});
