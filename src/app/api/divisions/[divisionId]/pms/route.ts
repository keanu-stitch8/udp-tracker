import { getDb } from "@/db/client";
import { readJson, rootRoute } from "@/lib/http";
import { setDivisionPms } from "@/modules/divisions/commands/division-pms";

/** Body: { userIds } — daftar PM lengkap divisi ini (menggantikan yang lama). */
export const PUT = rootRoute(async (request, ctx: RouteContext<"/api/divisions/[divisionId]/pms">) => {
  await setDivisionPms(getDb(), (await ctx.params).divisionId, await readJson(request));
  return new Response(null, { status: 204 });
});
