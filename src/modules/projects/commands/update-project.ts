import "server-only";
import type { Db } from "@/db/types";
import { updateProjectRow } from "../api/projects-repo";
import { toProject } from "../mappers/project";
import { assertDivisionExists, findProjectOrThrow, planProjectUpdate } from "../services/projects";
import type { Project } from "../types/project";

export async function updateProject(db: Db, id: string, input: unknown): Promise<Project> {
  const existing = await findProjectOrThrow(db, id);
  const patch = planProjectUpdate(existing, input);
  if (patch.divisionId) await assertDivisionExists(db, patch.divisionId);
  return toProject(await updateProjectRow(db, id, patch));
}
