import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectCategoryGroup, type CategoryGroupRow } from "../api/category-groups-repo";
import { categoryGroupInputSchema } from "../types/category-group-input";

/** Nama grup unik di proyek (tanpa beda huruf besar). */
export function planCategoryGroup(input: unknown, otherNames: string[]): { name: string } {
  const v = parseOrThrow(categoryGroupInputSchema, input);
  if (otherNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) throw new ValidationError({ name: ["Nama grup sudah dipakai."] });
  return v;
}

export async function findCategoryGroupOrThrow(db: Db, projectId: string, id: string): Promise<CategoryGroupRow> {
  const row = z.uuid().safeParse(id).success ? await selectCategoryGroup(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Grup kategori tidak ditemukan.");
  return row;
}
