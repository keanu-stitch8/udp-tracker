import type { BudgetRow } from "../api/budgets-repo";
import type { Budget } from "../types/budget";

export function toBudget(row: BudgetRow, categoryIds: string[]): Budget {
  return { id: row.id, name: row.name, rate: row.rate, employeeRate: row.employeeRate, basis: row.basis, days: row.days, note: row.note, categoryIds };
}
