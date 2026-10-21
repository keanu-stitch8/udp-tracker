import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { vehicles } from "@/db/schema";
import type { Db } from "@/db/types";

export type VehicleRow = typeof vehicles.$inferSelect;

export async function insertVehicles(db: Db, values: (typeof vehicles.$inferInsert)[]): Promise<VehicleRow[]> {
  if (!values.length) return [];
  return db.insert(vehicles).values(values).returning();
}

export function selectVehicles(db: Db, projectId: string): Promise<VehicleRow[]> {
  return db.select().from(vehicles).where(eq(vehicles.projectId, projectId)).orderBy(asc(vehicles.sortOrder));
}

export async function selectVehicle(db: Db, projectId: string, id: string): Promise<VehicleRow | undefined> {
  const [row] = await db.select().from(vehicles).where(and(eq(vehicles.projectId, projectId), eq(vehicles.id, id)));
  return row;
}

export async function updateVehicleRow(db: Db, id: string, patch: Partial<typeof vehicles.$inferInsert>): Promise<VehicleRow> {
  const [row] = await db.update(vehicles).set(patch).where(eq(vehicles.id, id)).returning();
  return row;
}

export async function deleteVehicleRow(db: Db, id: string): Promise<void> {
  await db.delete(vehicles).where(eq(vehicles.id, id));
}
