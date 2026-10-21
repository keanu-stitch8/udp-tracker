import type { BudgetBasis } from "@/modules/shared/types/enums";

export interface Budget {
  id: string;
  name: string;
  rate: number;
  basis: BudgetBasis;
  note: string | null;
  categoryIds: string[];
}

export interface BudgetUsage {
  budgetId: string;
  name: string;
  limit: number;
  used: number;
  remaining: number;
  /** Kelebihan dari pagu → ditanggung kantor (spec §3.3). */
  overBy: number;
  ratio: number;
}

export interface DailyBudgetUsage {
  budgetId: string;
  name: string;
  limit: number;
  used: number;
}
