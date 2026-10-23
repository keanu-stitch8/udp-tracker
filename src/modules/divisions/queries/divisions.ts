import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectDivisionPms, selectPmDivisionIds } from "@/modules/users/api/access-repo";
import { selectUsers } from "@/modules/users/api/users-repo";
import { accessibleProjectIds } from "@/modules/users/services/project-role";
import type { CurrentUser } from "@/modules/users/types/user";
import { countProjectsByDivision, selectDivisions, selectProjectDivisionIds } from "../api/divisions-repo";
import { toDivision } from "../mappers/division";
import type { Division } from "../types/division";

const byName = (a: Division, b: Division) => a.name.localeCompare(b.name, "id");

/** Semua divisi A–Z, dengan jumlah proyek dan PM-nya (tampilan Root). */
export const listDivisions = cache(async (db: Db): Promise<Division[]> => {
  const [rows, counts, pmRows, users] = await Promise.all([selectDivisions(db), countProjectsByDivision(db), selectDivisionPms(db), selectUsers(db)]);
  const userById = new Map(users.map((u) => [u.id, u]));
  return rows
    .map((row) => {
      const pms = pmRows
        .filter((pm) => pm.divisionId === row.id)
        .map((pm) => userById.get(pm.userId)!)
        .map((u) => ({ id: u.id, name: u.name, email: u.email }))
        .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, "id"));
      return toDivision(row, counts.get(row.id) ?? 0, { canCreateProject: true, pms });
    })
    .sort(byName);
});

/**
 * Divisi yang terlihat oleh user: Root semua; selain itu divisi PM-nya + divisi proyek tempat ia anggota
 * (untuk mengelompokkan pemilih proyek). `canCreateProject` hanya untuk divisi PM-nya.
 */
export const listDivisionsFor = cache(async (db: Db, user: CurrentUser): Promise<Division[]> => {
  if (user.isRoot && user.status === "active") return listDivisions(db);
  const projectIds = await accessibleProjectIds(db, user);
  const pmDivisionIds = user.status === "active" ? await selectPmDivisionIds(db, user.id) : [];
  const memberDivisionIds = projectIds === "all" ? [] : await selectProjectDivisionIds(db, projectIds);
  const visible = new Set([...pmDivisionIds, ...memberDivisionIds]);
  const [rows, counts] = await Promise.all([selectDivisions(db), countProjectsByDivision(db)]);
  return rows
    .filter((row) => visible.has(row.id))
    .map((row) => toDivision(row, counts.get(row.id) ?? 0, { canCreateProject: pmDivisionIds.includes(row.id), pms: [] }))
    .sort(byName);
});
