import "server-only";
import type { Db } from "@/db/types";
import type { Actor } from "@/modules/users/types/user";
import { updateProjectRow } from "../api/projects-repo";
import { toProject } from "../mappers/project";
import { assertCanUseDivision, assertDivisionExists, findProjectOrThrow, planProjectUpdate } from "../services/projects";
import type { Project } from "../types/project";

/** Pindah divisi mengikuti aturan buat proyek: PM hanya ke divisinya sendiri. */
export async function updateProject(db: Db, actor: Actor, id: string, input: unknown): Promise<Project> {
  const existing = await findProjectOrThrow(db, id);
  const patch = planProjectUpdate(existing, input);
  if (patch.divisionId && patch.divisionId !== existing.divisionId) {
    await assertDivisionExists(db, patch.divisionId);
    await assertCanUseDivision(db, actor, patch.divisionId);
  }
  return toProject(await updateProjectRow(db, id, patch));
}
