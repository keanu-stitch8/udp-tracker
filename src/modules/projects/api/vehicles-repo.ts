import "server-only";
import { asc, eq } from "drizzle-orm";
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
