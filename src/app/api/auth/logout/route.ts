import { cookies } from "next/headers";
import { route } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";

export const POST = route(
  async () => {
    (await cookies()).delete(SESSION_COOKIE);
    return new Response(null, { status: 204 });
  },
  { public: true },
);
