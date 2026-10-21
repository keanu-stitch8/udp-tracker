import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { env } from "@/lib/env";
import { clientIp, readJson, route } from "@/lib/http";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { login } from "@/modules/auth/services/login";

export const POST = route(
  async (request) => {
    await login(getDb(), await readJson(request), { ip: clientIp(request), passwordHash: env().APP_PASSWORD_HASH });
    (await cookies()).set(SESSION_COOKIE, await createSessionToken(env().SESSION_SECRET), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return new Response(null, { status: 204 });
  },
  { public: true },
);
