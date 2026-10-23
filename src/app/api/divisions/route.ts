import { getDb } from "@/db/client";
import { readJson, rootRoute, route } from "@/lib/http";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { listDivisionsFor } from "@/modules/divisions/queries/divisions";

export const GET = route(async (_request, _ctx, { user }) => Response.json(await listDivisionsFor(getDb(), user)));

export const POST = rootRoute(async (request) => Response.json(await createDivision(getDb(), await readJson(request)), { status: 201 }));
