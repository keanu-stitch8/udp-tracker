import "server-only";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { moveCategoriesToGroup, selectCategories } from "../api/categories-repo";
import { deleteCategoryGroupRow, insertCategoryGroups, selectCategoryGroups, updateCategoryGroupRow } from "../api/category-groups-repo";
import { toCategoryGroup } from "../mappers/category-group";
import { findCategoryGroupOrThrow, planCategoryGroup } from "../services/category-groups";
import type { CategoryGroup } from "../types/category-group";

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

async function otherNames(db: Db, projectId: string, exceptId?: string) {
  return (await selectCategoryGroups(db, projectId)).filter((g) => g.id !== exceptId).map((g) => g.name);
}

export async function createCategoryGroup(db: Db, projectId: string, input: unknown): Promise<CategoryGroup> {
  await editableProject(db, projectId);
  const values = planCategoryGroup(input, await otherNames(db, projectId));
  const [row] = await insertCategoryGroups(db, [{ ...values, projectId }]);
  return toCategoryGroup(row);
}

export async function renameCategoryGroup(db: Db, projectId: string, id: string, input: unknown): Promise<CategoryGroup> {
  await editableProject(db, projectId);
  await findCategoryGroupOrThrow(db, projectId, id);
  const values = planCategoryGroup(input, await otherNames(db, projectId, id));
  return toCategoryGroup(await updateCategoryGroupRow(db, id, values));
}

/**
 * Hapus grup. Grup berisi kategori (termasuk arsip) wajib punya `moveTo`: semua kategorinya dipindah ke grup itu dulu,
 * karena kategori pengeluaran wajib bergrup. Pindah + hapus dalam satu transaksi DB.
 */
export async function deleteCategoryGroup(db: Db, projectId: string, id: string, options: { moveTo?: string | null } = {}): Promise<void> {
  await editableProject(db, projectId);
  await findCategoryGroupOrThrow(db, projectId, id);
  const count = (await selectCategories(db, projectId)).filter((c) => c.groupId === id).length;
  const { moveTo } = options;
  if (count && !moveTo) throw new ValidationError({ moveTo: [`Grup masih berisi ${count} kategori. Pilih grup tujuan.`] });
  if (count && moveTo === id) throw new ValidationError({ moveTo: ["Pilih grup tujuan lain."] });
  if (count && moveTo) await findCategoryGroupOrThrow(db, projectId, moveTo);
  await db.transaction(async (tx) => {
    if (count && moveTo) await moveCategoriesToGroup(tx, id, moveTo);
    await deleteCategoryGroupRow(tx, id);
  });
}
