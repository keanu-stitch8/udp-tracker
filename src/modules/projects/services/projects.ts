import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { findDivisionOrThrow } from "@/modules/divisions/services/divisions";
import { selectPmDivisionIds } from "@/modules/users/api/access-repo";
import type { Actor } from "@/modules/users/types/user";
import { selectProject, type NewProjectRow, type ProjectRow } from "../api/projects-repo";
import { createProjectSchema, PROJECT_END_BEFORE_START, updateProjectSchema } from "../types/project-input";

export const PROJECT_LOCKED_MESSAGE = "Proyek sudah selesai dan dikunci. Buka kembali proyek di Pengaturan untuk mengubah data.";

export function parseCreateProject(input: unknown) {
  return parseOrThrow(createProjectSchema, input);
}

/** Proyek dari id (uuid tidak valid diperlakukan sebagai tidak ditemukan, bukan error DB). */
export async function findProjectOrThrow(db: Db, id: string): Promise<ProjectRow> {
  const row = z.uuid().safeParse(id).success ? await selectProject(db, id) : undefined;
  if (!row) throw new NotFoundError("Proyek tidak ditemukan.");
  return row;
}

/** Aturan bisnis spec §3.4: proyek `done` menolak semua mutasi. Dipakai juga oleh command modul lain. */
export function assertProjectEditable(row: ProjectRow): void {
  if (row.status === "done") throw new ConflictError(PROJECT_LOCKED_MESSAGE);
}

/** Validasi perubahan proyek terhadap data lama; proyek selesai hanya boleh diubah statusnya. */
export function planProjectUpdate(existing: ProjectRow, input: unknown): Partial<NewProjectRow> {
  const patch = parseOrThrow(updateProjectSchema, input);
  const onlyStatus = Object.keys(patch).every((key) => key === "status");
  if (!onlyStatus) assertProjectEditable(existing);
  const start = patch.startDate ?? existing.startDate;
  const end = patch.endDate ?? existing.endDate;
  if (end < start) throw new ValidationError({ endDate: [PROJECT_END_BEFORE_START] });
  return patch;
}

/** Divisi tujuan proyek harus ada; tidak ditemukan → error di field `divisionId` (form), bukan 404. */
export async function assertDivisionExists(db: Db, divisionId: string): Promise<void> {
  await findDivisionOrThrow(db, divisionId).catch((error) => {
    if (error instanceof NotFoundError) throw new ValidationError({ divisionId: ["Divisi tidak ditemukan."] });
    throw error;
  });
}

/** Divisi tempat actor boleh membuat/memindahkan proyek: `"all"` untuk Root, selain itu divisi PM-nya. */
export async function creatableDivisionIds(db: Db, actor: Actor): Promise<"all" | string[]> {
  return actor.isRoot ? "all" : selectPmDivisionIds(db, actor.id);
}

/** Root: divisi mana pun; PM: hanya divisinya; selain itu tidak boleh membuat proyek (spec §2). */
export async function assertCanUseDivision(db: Db, actor: Actor, divisionId: string): Promise<void> {
  const allowed = await creatableDivisionIds(db, actor);
  if (allowed === "all") return;
  if (!allowed.length) throw new ForbiddenError("Hanya Root atau PM yang bisa membuat proyek.");
  if (!allowed.includes(divisionId)) throw new ValidationError({ divisionId: ["Kamu bukan PM divisi ini."] });
}
