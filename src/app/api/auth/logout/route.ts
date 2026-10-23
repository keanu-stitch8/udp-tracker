import { cookies } from "next/headers";
import { publicRoute } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";

export const POST = publicRoute(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return new Response(null, { status: 204 });
});
