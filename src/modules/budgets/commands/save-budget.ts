import "server-only";
import type { Db } from "@/db/types";
import { buildProjectDefaults } from "@/modules/projects/lib/seed-defaults";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import {
  deleteBudgetRow,
  insertBudget,
  insertBudgetCategories,
  replaceBudgetCategories,
  selectBudgets,
  updateBudgetRow,
} from "../api/budgets-repo";
import { insertCategories, selectCategories, updateCategoryRow } from "../api/categories-repo";
import { toBudget } from "../mappers/budget";
import { toCategory } from "../mappers/category";
import { findBudgetOrThrow, planBudget } from "../services/budgets";
import type { Budget } from "../types/budget";

async function editableProject(db: Db, projectId: string) {
  const project = await findProjectOrThrow(db, projectId);
  assertProjectEditable(project);
  return project;
}

async function refs(db: Db, projectId: string, exceptBudgetId?: string) {
  const [categoryRows, budgetRows] = await Promise.all([selectCategories(db, projectId), selectBudgets(db, projectId)]);
  return { categories: categoryRows.map(toCategory), otherBudgetNames: budgetRows.filter((b) => b.id !== exceptBudgetId).map((b) => b.name) };
}

export async function createBudget(db: Db, projectId: string, input: unknown): Promise<Budget> {
  await editableProject(db, projectId);
  const { categoryIds, ...values } = planBudget(input, await refs(db, projectId));
  return db.transaction(async (tx) => {
    const row = await insertBudget(tx, { ...values, projectId });
    await insertBudgetCategories(tx, row.id, categoryIds);
    return toBudget(row, categoryIds);
  });
}

export async function updateBudget(db: Db, projectId: string, id: string, input: unknown): Promise<Budget> {
  await editableProject(db, projectId);
  await findBudgetOrThrow(db, projectId, id);
  const { categoryIds, ...values } = planBudget(input, await refs(db, projectId, id));
  return db.transaction(async (tx) => {
    const row = await updateBudgetRow(tx, id, values);
    await replaceBudgetCategories(tx, id, categoryIds);
    return toBudget(row, categoryIds);
  });
}

export async function deleteBudget(db: Db, projectId: string, id: string): Promise<void> {
  await editableProject(db, projectId);
  await findBudgetOrThrow(db, projectId, id);
  await deleteBudgetRow(db, id);
}

export interface ApplyDefaultsResult {
  renamed: string[];
  addedCategories: string[];
  addedBudgets: string[];
}

/**
 * Lengkapi proyek dengan kategori & pagu default (surat penawaran) yang belum ada — berdasarkan nama.
 * Tidak mengubah tarif/kategori pagu yang sudah ada. Proyek lama: "BBM" → "BBM Perjalanan".
 */
export async function applyDefaultBudgets(db: Db, projectId: string): Promise<ApplyDefaultsResult> {
  const project = await editableProject(db, projectId);
  return db.transaction(async (tx) => {
    const result: ApplyDefaultsResult = { renamed: [], addedCategories: [], addedBudgets: [] };
    const defaults = buildProjectDefaults([]);
    let categoryRows = await selectCategories(tx, project.id);
    const byName = () => new Map(categoryRows.map((c) => [c.name, c]));

    const legacyFuel = byName().get("BBM");
    if (legacyFuel && !byName().has("BBM Perjalanan")) {
      await updateCategoryRow(tx, legacyFuel.id, { name: "BBM Perjalanan" });
      result.renamed.push("BBM → BBM Perjalanan");
    }

    categoryRows = await selectCategories(tx, project.id);
    const missing = defaults.categories.filter((c) => !byName().has(c.name));
    await insertCategories(
      tx,
      missing.map((c) => ({ ...c, projectId: project.id, sortOrder: defaults.categories.indexOf(c) })),
    );
    result.addedCategories.push(...missing.map((c) => c.name));
    categoryRows = await selectCategories(tx, project.id);
    // urutkan kategori default sesuai urutan surat penawaran; kategori buatan pengguna di belakang
    for (const row of categoryRows) {
      const index = defaults.categories.findIndex((c) => c.name === row.name);
      const sortOrder = index === -1 ? defaults.categories.length + row.sortOrder : index;
      if (row.sortOrder !== sortOrder) await updateCategoryRow(tx, row.id, { sortOrder });
    }

    const existingBudgets = new Set((await selectBudgets(tx, project.id)).map((b) => b.name));
    const ids = byName();
    for (const seed of defaults.budgets.filter((b) => !existingBudgets.has(b.name))) {
      const row = await insertBudget(tx, { projectId: project.id, name: seed.name, rate: seed.rate, basis: seed.basis, note: seed.note });
      await insertBudgetCategories(
        tx,
        row.id,
        seed.categoryNames.map((n) => ids.get(n)?.id).filter((id): id is string => !!id),
      );
      result.addedBudgets.push(seed.name);
    }
    return result;
  });
}
