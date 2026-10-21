import "server-only";
import type { Db } from "@/db/types";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { insertCategories, selectCategories, updateCategoryRow } from "../api/categories-repo";
import { toCategory } from "../mappers/category";
import { findCategoryOrThrow, planCategory } from "../services/categories";
import type { Category } from "../types/category";

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

async function refs(db: Db, projectId: string, exceptId?: string) {
  const rows = await selectCategories(db, projectId);
  return {
    otherNames: rows.filter((r) => r.id !== exceptId).map((r) => r.name),
    nextSortOrder: Math.max(-1, ...rows.map((r) => r.sortOrder)) + 1,
  };
}

export async function createCategory(db: Db, projectId: string, input: unknown): Promise<Category> {
  await editableProject(db, projectId);
  const r = await refs(db, projectId);
  const values = planCategory(input, { otherNames: r.otherNames });
  const [row] = await insertCategories(db, [{ ...values, projectId, sortOrder: r.nextSortOrder }]);
  return toCategory(row);
}

export async function updateCategory(db: Db, projectId: string, id: string, input: unknown): Promise<Category> {
  await editableProject(db, projectId);
  const existing = await findCategoryOrThrow(db, projectId, id);
  const values = planCategory(input, { existing, otherNames: (await refs(db, projectId, id)).otherNames });
  return toCategory(await updateCategoryRow(db, id, values));
}
