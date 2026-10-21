import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { disconnectGoogle, googleAccount } from "@/modules/google/services/google-oauth";

export const GET = route(async () => Response.json(await googleAccount(getDb())));

/** Hanya menghapus token di DB (client OAuth dipakai bersama mkk-dashboard). */
export const DELETE = route(async () => {
  await disconnectGoogle(getDb());
  return new Response(null, { status: 204 });
});
