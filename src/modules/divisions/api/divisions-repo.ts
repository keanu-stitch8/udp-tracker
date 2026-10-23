import "server-only";
import { count, eq, inArray } from "drizzle-orm";
import { divisions, projects } from "@/db/schema";
import type { Db } from "@/db/types";

export type DivisionRow = typeof divisions.$inferSelect;

export function selectDivisions(db: Db): Promise<DivisionRow[]> {
  return db.select().from(divisions);
}

export async function selectDivision(db: Db, id: string): Promise<DivisionRow | undefined> {
  const [row] = await db.select().from(divisions).where(eq(divisions.id, id));
  return row;
}

export async function insertDivision(db: Db, values: typeof divisions.$inferInsert): Promise<DivisionRow> {
  const [row] = await db.insert(divisions).values(values).returning();
  return row;
}

export async function updateDivisionRow(db: Db, id: string, patch: Partial<typeof divisions.$inferInsert>): Promise<DivisionRow> {
  const [row] = await db.update(divisions).set(patch).where(eq(divisions.id, id)).returning();
  return row;
}

export async function deleteDivisionRow(db: Db, id: string): Promise<void> {
  await db.delete(divisions).where(eq(divisions.id, id));
}

/** Jumlah proyek per divisi (divisi tanpa proyek tidak ada di map). */
export async function countProjectsByDivision(db: Db): Promise<Map<string, number>> {
  const rows = await db.select({ divisionId: projects.divisionId, n: count() }).from(projects).groupBy(projects.divisionId);
  return new Map(rows.map((r) => [r.divisionId, r.n]));
}

/** Divisi dari sekumpulan proyek (tanpa duplikat). */
export async function selectProjectDivisionIds(db: Db, projectIds: string[]): Promise<string[]> {
  if (!projectIds.length) return [];
  const rows = await db.selectDistinct({ divisionId: projects.divisionId }).from(projects).where(inArray(projects.id, projectIds));
  return rows.map((r) => r.divisionId);
}
