import type { CategoryGroupRow } from "../api/category-groups-repo";
import type { CategoryGroup } from "../types/category-group";

export function toCategoryGroup(row: CategoryGroupRow): CategoryGroup {
  return { id: row.id, name: row.name };
}
