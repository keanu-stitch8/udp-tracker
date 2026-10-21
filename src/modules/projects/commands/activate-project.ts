import "server-only";
import { cookies } from "next/headers";
import type { Db } from "@/db/types";
import { ACTIVE_PROJECT_COOKIE } from "../lib/active-project";
import { findProjectOrThrow } from "../services/projects";

export async function activateProject(db: Db, id: string): Promise<void> {
  await findProjectOrThrow(db, id);
  (await cookies()).set(ACTIVE_PROJECT_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
