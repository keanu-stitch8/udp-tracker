import type { BudgetRow } from "../api/budgets-repo";
import type { Budget } from "../types/budget";

export function toBudget(row: BudgetRow, categoryIds: string[]): Budget {
  return { id: row.id, name: row.name, rate: row.rate, basis: row.basis, note: row.note, categoryIds };
}
