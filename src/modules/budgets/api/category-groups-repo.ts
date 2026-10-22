import "server-only";
import { and, eq } from "drizzle-orm";
import { categoryGroups } from "@/db/schema";
import type { Db } from "@/db/types";

export type CategoryGroupRow = typeof categoryGroups.$inferSelect;

export async function insertCategoryGroups(db: Db, values: (typeof categoryGroups.$inferInsert)[]): Promise<CategoryGroupRow[]> {
  if (!values.length) return [];
  return db.insert(categoryGroups).values(values).returning();
}

export function selectCategoryGroups(db: Db, projectId: string): Promise<CategoryGroupRow[]> {
  return db.select().from(categoryGroups).where(eq(categoryGroups.projectId, projectId));
}

export async function selectCategoryGroup(db: Db, projectId: string, id: string): Promise<CategoryGroupRow | undefined> {
  const [row] = await db.select().from(categoryGroups).where(and(eq(categoryGroups.projectId, projectId), eq(categoryGroups.id, id)));
  return row;
}

export async function updateCategoryGroupRow(db: Db, id: string, patch: Partial<typeof categoryGroups.$inferInsert>): Promise<CategoryGroupRow> {
  const [row] = await db.update(categoryGroups).set(patch).where(eq(categoryGroups.id, id)).returning();
  return row;
}

export async function deleteCategoryGroupRow(db: Db, id: string): Promise<void> {
  await db.delete(categoryGroups).where(eq(categoryGroups.id, id));
}
