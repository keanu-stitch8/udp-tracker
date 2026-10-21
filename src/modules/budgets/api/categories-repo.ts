import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { categories } from "@/db/schema";
import type { Db } from "@/db/types";

export type CategoryRow = typeof categories.$inferSelect;

export async function insertCategories(db: Db, values: (typeof categories.$inferInsert)[]): Promise<CategoryRow[]> {
  if (!values.length) return [];
  return db.insert(categories).values(values).returning();
}

export function selectCategories(db: Db, projectId: string): Promise<CategoryRow[]> {
  return db.select().from(categories).where(eq(categories.projectId, projectId)).orderBy(asc(categories.sortOrder));
}

export async function updateCategoryRow(db: Db, id: string, patch: Partial<typeof categories.$inferInsert>): Promise<CategoryRow> {
  const [row] = await db.update(categories).set(patch).where(eq(categories.id, id)).returning();
  return row;
}

export async function selectCategory(db: Db, projectId: string, id: string): Promise<CategoryRow | undefined> {
  const [row] = await db.select().from(categories).where(and(eq(categories.projectId, projectId), eq(categories.id, id)));
  return row;
}
