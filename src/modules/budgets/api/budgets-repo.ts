import "server-only";
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
