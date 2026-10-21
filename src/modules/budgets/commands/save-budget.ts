import "server-only";
import type { Db } from "@/db/types";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import {
  deleteBudgetRow,
  insertBudget,
  insertBudgetCategories,
  replaceBudgetCategories,
  selectBudgets,
  updateBudgetRow,
} from "../api/budgets-repo";
import { selectCategories } from "../api/categories-repo";
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
