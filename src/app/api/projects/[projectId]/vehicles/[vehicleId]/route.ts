import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { deleteVehicle, updateVehicle } from "@/modules/projects/commands/save-vehicle";

type Ctx = RouteContext<"/api/projects/[projectId]/vehicles/[vehicleId]">;

export const PATCH = route(async (request, ctx: Ctx) => {
  const { projectId, vehicleId } = await ctx.params;
  return Response.json(await updateVehicle(getDb(), projectId, vehicleId, await readJson(request)));
});

export const DELETE = route(async (_request, ctx: Ctx) => {
  const { projectId, vehicleId } = await ctx.params;
  await deleteVehicle(getDb(), projectId, vehicleId);
  return new Response(null, { status: 204 });
});
