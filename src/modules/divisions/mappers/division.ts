import type { DivisionRow } from "../api/divisions-repo";
import type { Division } from "../types/division";

export function toDivision(row: DivisionRow, projectCount: number): Division {
  return { id: row.id, name: row.name, projectCount };
}
