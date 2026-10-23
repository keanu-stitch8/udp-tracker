import type { DivisionRow } from "../api/divisions-repo";
import type { Division, DivisionPm } from "../types/division";

export function toDivision(row: DivisionRow, projectCount: number, extra: { canCreateProject: boolean; pms: DivisionPm[] } = { canCreateProject: true, pms: [] }): Division {
  return { id: row.id, name: row.name, projectCount, ...extra };
}
