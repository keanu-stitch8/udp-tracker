import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { applyDefaultBudgets } from "@/modules/budgets/commands/save-budget";

export const POST = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/budgets/defaults">) => {
  const { projectId } = await ctx.params;
  return Response.json(await applyDefaultBudgets(getDb(), projectId));
});
