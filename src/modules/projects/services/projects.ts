import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
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
