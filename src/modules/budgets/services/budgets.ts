import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError, type FieldErrors } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectBudget, type BudgetRow } from "../api/budgets-repo";
import { usesDays } from "../lib/budget";
import type { Category } from "../types/category";
import { budgetInputSchema } from "../types/budget-input";

export interface BudgetValues {
  name: string;
  rate: number;
  basis: BudgetRow["basis"];
  days: number | null;
  note: string | null;
  categoryIds: string[];
}

/** Validasi pagu: nama unik di proyek, kategori = pengeluaran milik proyek. */
export function planBudget(input: unknown, refs: { categories: Category[]; otherBudgetNames: string[] }): BudgetValues {
  const v = parseOrThrow(budgetInputSchema, input);
  const errors: FieldErrors = {};
  if (refs.otherBudgetNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) errors.name = ["Nama pagu sudah dipakai."];
  const byId = new Map(refs.categories.map((c) => [c.id, c]));
  const picked = v.categoryIds.map((id) => byId.get(id));
  if (picked.some((c) => !c)) errors.categoryIds = ["Kategori tidak ditemukan di proyek ini."];
  else if (picked.some((c) => c!.kind !== "expense")) errors.categoryIds = ["Pagu hanya untuk kategori pengeluaran."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  // Jumlah hari hanya bermakna untuk basis yang dikali hari.
  return { ...v, days: usesDays(v.basis) ? v.days : null, categoryIds: [...new Set(v.categoryIds)] };
}

export async function findBudgetOrThrow(db: Db, projectId: string, id: string): Promise<BudgetRow> {
  const row = z.uuid().safeParse(id).success ? await selectBudget(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Pagu tidak ditemukan.");
  return row;
}
