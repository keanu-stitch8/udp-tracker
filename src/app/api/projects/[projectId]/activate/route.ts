import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { activateProject } from "@/modules/projects/commands/activate-project";

export const POST = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/activate">) => {
  const { projectId } = await ctx.params;
  await activateProject(getDb(), projectId);
  return new Response(null, { status: 204 });
});
