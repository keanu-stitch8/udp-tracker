import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { isPmOfProjectDivision, isProjectMember, selectMemberProjectIds, selectPmDivisionIds, selectProjectIdsInDivisions } from "../api/access-repo";
import type { Role } from "../lib/access";
import type { CurrentUser } from "../types/user";

type RoleSubject = Pick<CurrentUser, "id" | "isRoot" | "status">;

/** Peran efektif user di satu proyek (spec §2, dicek berurutan). `null` = perlakukan proyek sebagai tidak ada (404). */
export async function projectRole(db: Db, user: RoleSubject, projectId: string): Promise<Role | null> {
  if (user.status !== "active" || !z.uuid().safeParse(projectId).success) return null;
  if (user.isRoot) return "root";
  if (await isPmOfProjectDivision(db, user.id, projectId)) return "pm";
  if (await isProjectMember(db, user.id, projectId)) return "member";
  return null;
}

/** Proyek yang boleh dilihat user: `"all"` untuk Root, selain itu proyek di divisi PM-nya + proyek tempat ia anggota. */
export async function accessibleProjectIds(db: Db, user: RoleSubject): Promise<"all" | string[]> {
  if (user.status !== "active") return [];
  if (user.isRoot) return "all";
  const [pmProjects, memberProjects] = await Promise.all([selectPmDivisionIds(db, user.id).then((ids) => selectProjectIdsInDivisions(db, ids)), selectMemberProjectIds(db, user.id)]);
  return [...new Set([...pmProjects, ...memberProjects])];
}
