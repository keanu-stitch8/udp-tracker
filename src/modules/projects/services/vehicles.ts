import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError, type FieldErrors } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectVehicle, type VehicleRow } from "../api/vehicles-repo";
import { MAX_VEHICLES } from "../lib/vehicles";
import { vehicleInputSchema } from "../types/vehicle-input";

export interface VehicleValues {
  name: string;
  plate: string | null;
}

/** Nama mobil unik di proyek; maksimal 5 mobil saat menambah. */
export function planVehicle(input: unknown, refs: { otherNames: string[]; adding: boolean }): VehicleValues {
  const v = parseOrThrow(vehicleInputSchema, input);
  const errors: FieldErrors = {};
  if (refs.adding && refs.otherNames.length >= MAX_VEHICLES) errors._form = [`Maksimal ${MAX_VEHICLES} mobil per proyek.`];
  else if (refs.otherNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) errors.name = ["Nama mobil sudah dipakai."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return v;
}

export async function findVehicleOrThrow(db: Db, projectId: string, id: string): Promise<VehicleRow> {
  const row = z.uuid().safeParse(id).success ? await selectVehicle(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Mobil tidak ditemukan.");
  return row;
}
