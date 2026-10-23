import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Db } from "@/db/types";
import { env } from "@/lib/env";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { selectUser } from "../api/users-repo";
import { toCurrentUser } from "../mappers/user";
import type { CurrentUser } from "../types/user";

/** User dari cookie sesi, atau null (tanpa sesi / user sudah tidak ada). Status tidak disaring di sini. */
export const getCurrentUser = cache(async (db: Db): Promise<CurrentUser | null> => {
  const userId = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, env().SESSION_SECRET);
  const row = userId ? await selectUser(db, userId) : undefined;
  return row ? toCurrentUser(row) : null;
});

/** Untuk section halaman: proxy sudah menyaring sesi; user yang hilang dari DB dikirim ke login. */
export async function requireCurrentUser(db: Db): Promise<CurrentUser> {
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");
  return user;
}
