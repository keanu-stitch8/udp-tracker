import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { createBudget } from "@/modules/budgets/commands/save-budget";
import { getBudgetSettings } from "@/modules/budgets/queries/budget-settings";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/budgets">) => {
  const { projectId } = await ctx.params;
  return Response.json(await getBudgetSettings(getDb(), projectId));
});

export const POST = route(async (request, ctx: RouteContext<"/api/projects/[projectId]/budgets">) => {
  const { projectId } = await ctx.params;
  return Response.json(await createBudget(getDb(), projectId, await readJson(request)), { status: 201 });
});
