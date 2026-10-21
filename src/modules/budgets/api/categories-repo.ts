import "server-only";
import { categories } from "@/db/schema";
import type { Db } from "@/db/types";

export type CategoryRow = typeof categories.$inferSelect;

export async function insertCategories(db: Db, values: (typeof categories.$inferInsert)[]): Promise<CategoryRow[]> {
  if (!values.length) return [];
  return db.insert(categories).values(values).returning();
}
