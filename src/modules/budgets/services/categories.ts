import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError, type FieldErrors } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import type { CategoryKind } from "@/modules/shared/types/enums";
import { selectCategory, type CategoryRow } from "../api/categories-repo";
import { categoryInputSchema } from "../types/category-input";

export interface CategoryValues {
  kind: CategoryKind;
  name: string;
  icon: string;
  isVehicleRelated: boolean;
  archived: boolean;
  groupId: string | null;
}

/** Nama unik di proyek; jenis tetap; terkait mobil hanya pengeluaran; kategori sistem tidak bisa diarsipkan; pengeluaran wajib grup proyek. */
export function planCategory(input: unknown, refs: { existing?: CategoryRow; otherNames: string[]; groupIds: string[] }): CategoryValues {
  const v = parseOrThrow(categoryInputSchema, input);
  const errors: FieldErrors = {};
  const { existing } = refs;
  if (refs.otherNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) errors.name = ["Nama kategori sudah dipakai."];
  if (existing && existing.kind !== v.kind) errors.kind = ["Jenis kategori tidak bisa diubah."];
  if (v.isVehicleRelated && v.kind !== "expense") errors.isVehicleRelated = ["Hanya kategori pengeluaran yang bisa terkait mobil."];
  if (existing?.isAdminFee && v.archived) errors.archived = ["Kategori biaya admin dipakai otomatis untuk transfer, tidak bisa diarsipkan."];
  if (existing?.isOfficeFunding && v.archived) errors.archived = ["Kategori UDP kantor dipakai untuk menghitung UDP diterima, tidak bisa diarsipkan."];
  if (v.kind === "expense" && !v.groupId) errors.groupId = ["Pilih grup kategori."];
  else if (v.kind === "expense" && !refs.groupIds.includes(v.groupId!)) errors.groupId = ["Grup tidak ditemukan."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { ...v, groupId: v.kind === "expense" ? v.groupId : null };
}

export async function findCategoryOrThrow(db: Db, projectId: string, id: string): Promise<CategoryRow> {
  const row = z.uuid().safeParse(id).success ? await selectCategory(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Kategori tidak ditemukan.");
  return row;
}
