import { getDb } from "@/db/client";
import { rootRoute } from "@/lib/http";
import { listUsers } from "@/modules/users/queries/users";

export const GET = rootRoute(async () => Response.json(await listUsers(getDb())));
