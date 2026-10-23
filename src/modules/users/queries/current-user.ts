import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import type { Db } from "@/db/types";
import { env } from "@/lib/env";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { selectUser } from "../api/users-repo";
import { can } from "../lib/access";
import { readViewAs, VIEW_AS_COOKIE } from "../lib/view-as";
import { toCurrentUser } from "../mappers/user";
import { projectRole } from "../services/project-role";
import type { CurrentUser } from "../types/user";

/** Pemilik sesi (cookie), atau null (tanpa sesi / user sudah tidak ada). Status tidak disaring di sini. */
export const getSessionUser = cache(async (db: Db): Promise<CurrentUser | null> => {
  const userId = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, env().SESSION_SECRET);
  const row = userId ? await selectUser(db, userId) : undefined;
  return row ? toCurrentUser(row) : null;
});

export interface ViewAs {
  /** Root/PM pemilik sesi. */
  viewer: CurrentUser;
  /** Anggota yang tampilannya dipinjam. */
  target: CurrentUser;
  projectId: string;
}

/**
 * Mode "Lihat sebagai" yang masih sah: pemilik sesi Root/PM proyek itu, target anggota aktif proyek itu.
 * Cookie basi (hak dicabut, anggota dikeluarkan) diabaikan.
 */
export const getViewAs = cache(async (db: Db): Promise<ViewAs | null> => {
  const value = readViewAs((await cookies()).get(VIEW_AS_COOKIE)?.value);
  if (!value || !z.uuid().safeParse(value.userId).success) return null;
  const viewer = await getSessionUser(db);
  if (!viewer || !can(await projectRole(db, viewer, value.projectId), "manage")) return null;
  const row = await selectUser(db, value.userId);
  const target = row ? toCurrentUser(row) : null;
  if (!target || (await projectRole(db, target, value.projectId)) !== "member") return null;
  return { viewer, target, projectId: value.projectId };
});

/** Pengguna efektif: target "Lihat sebagai" bila aktif, selain itu pemilik sesi. Semua halaman & GET API memakai ini. */
export const getCurrentUser = cache(async (db: Db): Promise<CurrentUser | null> => (await getViewAs(db))?.target ?? (await getSessionUser(db)));

/** Untuk section halaman: proxy sudah menyaring sesi; user yang hilang dari DB dikirim ke login. */
export async function requireCurrentUser(db: Db): Promise<CurrentUser> {
  const user = await getCurrentUser(db);
  if (!user) redirect("/login");
  return user;
}
