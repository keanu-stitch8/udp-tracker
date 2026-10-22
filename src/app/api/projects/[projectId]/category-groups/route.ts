import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { createCategoryGroup } from "@/modules/budgets/commands/save-category-group";

export const POST = route(async (request, ctx: RouteContext<"/api/projects/[projectId]/category-groups">) => {
  const { projectId } = await ctx.params;
  return Response.json(await createCategoryGroup(getDb(), projectId, await readJson(request)), { status: 201 });
});
