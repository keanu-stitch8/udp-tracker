import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { updateCategory } from "@/modules/budgets/commands/save-category";

export const PATCH = projectRoute("manage", async (request, ctx: RouteContext<"/api/projects/[projectId]/categories/[categoryId]">) => {
  const { projectId, categoryId } = await ctx.params;
  return Response.json(await updateCategory(getDb(), projectId, categoryId, await readJson(request)));
});
