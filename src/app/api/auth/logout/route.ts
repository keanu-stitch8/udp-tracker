import { cookies } from "next/headers";
import { publicRoute } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";
import { VIEW_AS_COOKIE } from "@/modules/users/lib/view-as";

export const POST = publicRoute(async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(VIEW_AS_COOKIE);
  return new Response(null, { status: 204 });
});
