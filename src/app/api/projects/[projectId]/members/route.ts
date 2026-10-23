import { getDb } from "@/db/client";
import { projectRoute, readJson } from "@/lib/http";
import { addMemberByEmail } from "@/modules/members/commands/members";
import { listProjectMembers } from "@/modules/members/queries/members";

type Ctx = RouteContext<"/api/projects/[projectId]/members">;

export const GET = projectRoute("manage", async (_request, _ctx: Ctx, { projectId }) => Response.json(await listProjectMembers(getDb(), projectId)));

/** Body: { email }. Hasil: { result: "member" | "invited" }. */
export const POST = projectRoute("manage", async (request, _ctx: Ctx, { user, projectId }) =>
  Response.json(await addMemberByEmail(getDb(), user, projectId, await readJson(request)), { status: 201 }),
);
