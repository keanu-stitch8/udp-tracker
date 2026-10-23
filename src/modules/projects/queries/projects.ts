import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Db } from "@/db/types";
import { can } from "@/modules/users/lib/access";
import { getCurrentUser, getViewAs } from "@/modules/users/queries/current-user";
import { accessibleProjectIds, projectRole } from "@/modules/users/services/project-role";
import type { CurrentUser } from "@/modules/users/types/user";
import { walletScope } from "@/modules/wallets/services/wallet-scope";
import { selectProjects } from "../api/projects-repo";
import { selectVehicles } from "../api/vehicles-repo";
import { ACTIVE_PROJECT_COOKIE, pickActiveProject } from "../lib/active-project";
import { toProject, toProjectDetail } from "../mappers/project";
import { creatableDivisionIds, findProjectOrThrow } from "../services/projects";
import type { ActiveProject, Project, ProjectDetail } from "../types/project";

/** Semua proyek (tanpa saring akses): hanya untuk tes dan kode yang sudah memeriksa izin. */
export const listProjects = cache(async (db: Db): Promise<Project[]> => (await selectProjects(db)).map(toProject));

/** Proyek yang boleh diakses user (spec §5.7), urut terbaru. */
export const listProjectsFor = cache(async (db: Db, user: CurrentUser): Promise<Project[]> => {
  const [all, allowed] = await Promise.all([listProjects(db), accessibleProjectIds(db, user)]);
  return allowed === "all" ? all : all.filter((p) => allowed.includes(p.id));
});

export const getProjectDetail = cache(async (db: Db, id: string): Promise<ProjectDetail> => {
  const row = await findProjectOrThrow(db, id);
  return toProjectDetail(row, await selectVehicles(db, id));
});

/** Root, atau PM di minimal satu divisi. */
export const canCreateProjects = cache(async (db: Db, user: CurrentUser): Promise<boolean> => {
  if (user.status !== "active") return false;
  const divisions = await creatableDivisionIds(db, user);
  return divisions === "all" || divisions.length > 0;
});

/**
 * Proyek aktif untuk request ini, hanya dari proyek yang boleh diakses: cookie → fallback (cookie yang tidak boleh lagi
 * diabaikan). null bila user tidak punya proyek sama sekali.
 */
export const getActiveProject = cache(async (db: Db): Promise<ActiveProject | null> => {
  const user = await getCurrentUser(db);
  if (!user) return null;
  // Lihat sebagai: proyek dikunci ke proyek tempat mode itu dimulai.
  const cookieId = (await getViewAs(db))?.projectId ?? (await cookies()).get(ACTIVE_PROJECT_COOKIE)?.value;
  const active = pickActiveProject(await listProjectsFor(db, user), cookieId);
  if (!active) return null;
  const role = await projectRole(db, user, active.id);
  if (!role) return null;
  const [detail, scope] = await Promise.all([getProjectDetail(db, active.id), walletScope(db, role, user.id, active.id)]);
  return { ...detail, role, walletScope: scope };
});

/** Halaman yang butuh proyek: tanpa proyek → buat proyek (bila boleh) atau daftar proyek dengan empty state. */
export async function requireActiveProject(db: Db): Promise<ActiveProject> {
  const project = await getActiveProject(db);
  if (project) return project;
  const user = await getCurrentUser(db);
  redirect(user && (await canCreateProjects(db, user)) ? "/proyek/baru" : "/proyek");
}

/** Halaman pengaturan (pagu, kategori, ekspor, proyek, anggota): tanpa kemampuan `manage` → 404. */
export async function requireManagedProject(db: Db): Promise<ActiveProject> {
  const project = await requireActiveProject(db);
  if (!can(project.role, "manage")) notFound();
  return project;
}
