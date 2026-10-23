import { getDb } from "@/db/client";
import { readJson, route } from "@/lib/http";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { listDivisions } from "@/modules/divisions/queries/divisions";

export const GET = route(async () => Response.json(await listDivisions(getDb())));

export const POST = route(async (request) => Response.json(await createDivision(getDb(), await readJson(request)), { status: 201 }));
