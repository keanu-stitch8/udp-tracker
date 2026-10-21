import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectProjects } from "../api/projects-repo";
import { selectVehicles } from "../api/vehicles-repo";
import { ACTIVE_PROJECT_COOKIE, pickActiveProject } from "../lib/active-project";
import { toProject, toProjectDetail } from "../mappers/project";
import { findProjectOrThrow } from "../services/projects";
import type { Project, ProjectDetail } from "../types/project";

export const listProjects = cache(async (db: Db): Promise<Project[]> => (await selectProjects(db)).map(toProject));

export const getProjectDetail = cache(async (db: Db, id: string): Promise<ProjectDetail> => {
  const row = await findProjectOrThrow(db, id);
  return toProjectDetail(row, await selectVehicles(db, id));
});

/** Proyek aktif untuk request ini (cookie → fallback), atau null jika belum ada proyek sama sekali. */
export const getActiveProject = cache(async (db: Db): Promise<ProjectDetail | null> => {
  const cookieId = (await cookies()).get(ACTIVE_PROJECT_COOKIE)?.value;
  const active = pickActiveProject(await listProjects(db), cookieId);
  return active ? getProjectDetail(db, active.id) : null;
});
