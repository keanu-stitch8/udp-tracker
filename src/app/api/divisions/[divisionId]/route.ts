import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { deleteDivision, renameDivision } from "@/modules/divisions/commands/save-division";

type Ctx = RouteContext<"/api/divisions/[divisionId]">;

export const PATCH = route(async (request, ctx: Ctx) => {
  const { divisionId } = await ctx.params;
  return Response.json(await renameDivision(getDb(), divisionId, await readJson(request)));
});

export const DELETE = route(async (_request, ctx: Ctx) => {
  const { divisionId } = await ctx.params;
  await deleteDivision(getDb(), divisionId);
  return new Response(null, { status: 204 });
});
