import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { createCategory } from "@/modules/budgets/commands/save-category";
import { getCategorySettings } from "@/modules/budgets/queries/category-settings";

type Ctx = RouteContext<"/api/projects/[projectId]/categories">;

export const GET = route(async (_request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await getCategorySettings(getDb(), projectId));
});

export const POST = route(async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await createCategory(getDb(), projectId, await readJson(request)), { status: 201 });
});
