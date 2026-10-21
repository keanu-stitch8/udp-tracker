import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { budgetCategories, budgets } from "@/db/schema";
import type { Db } from "@/db/types";

export type BudgetRow = typeof budgets.$inferSelect;

export async function insertBudget(db: Db, values: typeof budgets.$inferInsert): Promise<BudgetRow> {
  const [row] = await db.insert(budgets).values(values).returning();
  return row;
}

export async function insertBudgetCategories(db: Db, budgetId: string, categoryIds: string[]): Promise<void> {
  if (!categoryIds.length) return;
  await db.insert(budgetCategories).values(categoryIds.map((categoryId) => ({ budgetId, categoryId })));
}

export function selectBudgets(db: Db, projectId: string): Promise<BudgetRow[]> {
  return db.select().from(budgets).where(eq(budgets.projectId, projectId)).orderBy(asc(budgets.createdAt));
}

export async function selectBudgetCategoryLinks(db: Db, budgetIds: string[]): Promise<{ budgetId: string; categoryId: string }[]> {
  if (!budgetIds.length) return [];
  return db.select().from(budgetCategories).where(inArray(budgetCategories.budgetId, budgetIds));
}

export async function selectBudget(db: Db, projectId: string, id: string): Promise<BudgetRow | undefined> {
  const [row] = await db.select().from(budgets).where(and(eq(budgets.projectId, projectId), eq(budgets.id, id)));
  return row;
}

export async function updateBudgetRow(db: Db, id: string, patch: Partial<typeof budgets.$inferInsert>): Promise<BudgetRow> {
  const [row] = await db.update(budgets).set(patch).where(eq(budgets.id, id)).returning();
  return row;
}

export async function deleteBudgetRow(db: Db, id: string): Promise<void> {
  await db.delete(budgets).where(eq(budgets.id, id));
}

export async function replaceBudgetCategories(db: Db, budgetId: string, categoryIds: string[]): Promise<void> {
  await db.delete(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));
  await insertBudgetCategories(db, budgetId, categoryIds);
}
