import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { createVehicle } from "@/modules/projects/commands/save-vehicle";
import { getProjectSettings } from "@/modules/projects/queries/project-settings";

type Ctx = RouteContext<"/api/projects/[projectId]/vehicles">;

export const GET = projectRoute("manage", async (_request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json((await getProjectSettings(getDb(), projectId)).vehicles);
});

export const POST = projectRoute("manage", async (request, ctx: Ctx) => {
  const { projectId } = await ctx.params;
  return Response.json(await createVehicle(getDb(), projectId, await readJson(request)), { status: 201 });
});
