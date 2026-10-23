import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { deleteCategoryGroup, renameCategoryGroup } from "@/modules/budgets/commands/save-category-group";

type Ctx = RouteContext<"/api/projects/[projectId]/category-groups/[groupId]">;

export const PATCH = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId, groupId } = await ctx.params;
  return Response.json(await renameCategoryGroup(getDb(), projectId, groupId, await readJson(request)));
});

/** `?pindahKe=<groupId>`: tujuan kategori bila grup masih berisi. */
export const DELETE = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId, groupId } = await ctx.params;
  await deleteCategoryGroup(getDb(), projectId, groupId, { moveTo: new URL(request.url).searchParams.get("pindahKe") });
  return new Response(null, { status: 204 });
});
