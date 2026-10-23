import type { BudgetBasis } from "@/modules/shared/types/enums";

export interface Budget {
  id: string;
  name: string;
  /** Tarif management (rahasia: hanya peran `budgetSecret`). */
  rate: number;
  /** Tarif karyawan; null = sama dengan tarif management. */
  employeeRate: number | null;
  basis: BudgetBasis;
  /** Jumlah hari khusus pagu ini (mis. 6 hari kerja); null = ikut periode proyek. Hanya untuk basis harian. */
  days: number | null;
  note: string | null;
  categoryIds: string[];
}

export interface BudgetUsage {
  budgetId: string;
  name: string;
  limit: number;
  used: number;
  remaining: number;
  /** Kelebihan dari pagu ini (bisa tertutup sisa pagu lain di total pagu). */
  overBy: number;
  ratio: number;
}

/** Semua pagu digabung: kelebihan satu pagu bisa tertutup sisa pagu lain. */
export interface BudgetTotal {
  limit: number;
  used: number;
  remaining: number;
  overBy: number;
}

/** Total dua pagu (Root/PM): cadangan = selisih pagu management dan pagu karyawan. */
export interface DualBudgetTotal {
  employeeLimit: number;
  managementLimit: number;
  reserve: number;
  used: number;
  /** Kelebihan atas pagu karyawan; tertutup cadangan selama `overManagement` = 0. */
  overEmployee: number;
  overManagement: number;
}

export interface DailyBudgetUsage {
  budgetId: string;
  name: string;
  /** Batas harian pagu karyawan. */
  limit: number;
  used: number;
  /** Batas harian pagu management — hanya untuk peran `budgetSecret`. */
  managementLimit?: number;
}
