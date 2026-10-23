import { getDb } from "@/db/client";
import { route } from "@/lib/http";
import { disconnectGoogle, googleAccount } from "@/modules/google/services/google-oauth";

export const GET = route(async (_request, _ctx, { user }) => Response.json(await googleAccount(getDb(), user.id)));

/** Hanya menghapus token user ini di DB (client OAuth dipakai bersama mkk-dashboard). */
export const DELETE = route(async (_request, _ctx, { user }) => {
  await disconnectGoogle(getDb(), user.id);
  return new Response(null, { status: 204 });
});
