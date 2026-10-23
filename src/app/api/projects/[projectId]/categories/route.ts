import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { createCategory } from "@/modules/budgets/commands/save-category";
import { getCategorySettings } from "@/modules/budgets/queries/category-settings";

type Ctx = RouteContext<"/api/projects/[projectId]/categories">;

export const GET = projectRoute("manage", async (_request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await getCategorySettings(getDb(), projectId));
});

export const POST = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await createCategory(getDb(), projectId, await readJson(request)), { status: 201 });
});
