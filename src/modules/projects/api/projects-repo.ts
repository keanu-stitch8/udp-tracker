import "server-only";
import { desc, eq } from "drizzle-orm";
import { projects } from "@/db/schema";
import type { Db } from "@/db/types";

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

export async function insertProject(db: Db, values: NewProjectRow): Promise<ProjectRow> {
  const [row] = await db.insert(projects).values(values).returning();
  return row;
}

export function selectProjects(db: Db): Promise<ProjectRow[]> {
  return db.select().from(projects).orderBy(desc(projects.startDate), desc(projects.createdAt));
}

export async function selectProject(db: Db, id: string): Promise<ProjectRow | undefined> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id));
  return row;
}

export async function updateProjectRow(db: Db, id: string, patch: Partial<NewProjectRow>): Promise<ProjectRow> {
  const [row] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
  return row;
}
