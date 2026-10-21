import type { CategoryKind } from "@/modules/shared/types/enums";

export interface Category {
  id: string;
  kind: CategoryKind;
  name: string;
  icon: string;
  isVehicleRelated: boolean;
  isAdminFee: boolean;
  isOfficeFunding: boolean;
  archived: boolean;
}
