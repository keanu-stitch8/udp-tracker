import type { CategoryRow } from "../api/categories-repo";
import type { Category } from "../types/category";

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    icon: row.icon,
    isVehicleRelated: row.isVehicleRelated,
    isAdminFee: row.isAdminFee,
    isOfficeFunding: row.isOfficeFunding,
    archived: row.archived,
    groupId: row.groupId,
  };
}
