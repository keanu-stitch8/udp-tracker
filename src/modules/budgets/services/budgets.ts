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
  employeeRate: number | null;
  basis: BudgetRow["basis"];
  days: number | null;
  note: string | null;
  categoryIds: string[];
}

/** Validasi pagu: nama unik di proyek, kategori = pengeluaran milik proyek, tarif karyawan ≤ tarif management. */
export function planBudget(input: unknown, refs: { categories: Category[]; otherBudgetNames: string[] }): BudgetValues {
  const v = parseOrThrow(budgetInputSchema, input);
  const errors: FieldErrors = {};
  if (refs.otherBudgetNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) errors.name = ["Nama pagu sudah dipakai."];
  if (v.employeeRate !== null && v.employeeRate > v.rate) errors.employeeRate = ["Tarif karyawan tidak boleh lebih dari tarif management."];
  const byId = new Map(refs.categories.map((c) => [c.id, c]));
  const picked = v.categoryIds.map((id) => byId.get(id));
  if (picked.some((c) => !c)) errors.categoryIds = ["Kategori tidak ditemukan di proyek ini."];
  else if (picked.some((c) => c!.kind !== "expense")) errors.categoryIds = ["Pagu hanya untuk kategori pengeluaran."];
  if (Object.keys(errors).length) throw new ValidationError(errors);
  // `days` = jumlah hari (basis harian) atau jumlah trip (per_vehicle); basis lain tidak memakainya.
  return { ...v, days: usesDays(v.basis) || v.basis === "per_vehicle" ? v.days : null, categoryIds: [...new Set(v.categoryIds)] };
}

export async function findBudgetOrThrow(db: Db, projectId: string, id: string): Promise<BudgetRow> {
  const row = z.uuid().safeParse(id).success ? await selectBudget(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Pagu tidak ditemukan.");
  return row;
}
