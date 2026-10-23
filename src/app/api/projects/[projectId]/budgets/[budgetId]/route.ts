import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { deleteBudget, updateBudget } from "@/modules/budgets/commands/save-budget";

type Ctx = RouteContext<"/api/projects/[projectId]/budgets/[budgetId]">;

export const PATCH = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId, budgetId } = await ctx.params;
  return Response.json(await updateBudget(getDb(), projectId, budgetId, await readJson(request)));
});

export const DELETE = projectRoute("manage", async (_request, ctx: Ctx) => {
  const { projectId, budgetId } = await ctx.params;
  await deleteBudget(getDb(), projectId, budgetId);
  return new Response(null, { status: 204 });
});
