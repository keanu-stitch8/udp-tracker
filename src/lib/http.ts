import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "./env";
import { toErrorResponse, UnauthorizedError, ValidationError } from "./errors";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Pertahanan berlapis: proxy sudah menyaring, tapi setiap route tetap memeriksa sesi (spec §7). */
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token, env().SESSION_SECRET))) throw new UnauthorizedError();
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError({ _form: ["Body request harus JSON."] }, "Body request harus JSON.");
  }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Bungkus route handler: cek sesi (kecuali `public`) lalu ubah error menjadi respons JSON. */
export function route<C>(handler: Handler<C>, options: { public?: boolean } = {}): Handler<C> {
  return async (request, context) => {
    // Tandai dinamis di luar try: penolakan cookies() saat prerender build adalah sinyal Next, jangan diubah jadi respons error.
    await connection();
    try {
      if (!options.public) await requireSession();
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
