import { formatRupiah } from "@/modules/shared/lib/money";
import type { BudgetBasis } from "@/modules/shared/types/enums";
import type { Budget } from "../types/budget";
import type { BudgetContext } from "./budget";

export const BASIS_LABELS: Record<BudgetBasis, string> = {
  per_pax_per_day: "per orang per hari",
  per_vehicle_per_day: "per mobil per hari",
  per_vehicle: "per mobil per trip",
  per_day: "per hari",
  lump_sum: "total sekali",
};

/** "Rp 150.000 × 9 orang × 6 hari" — menjelaskan asal angka pagu. */
export function limitFormula(budget: Pick<Budget, "rate" | "basis">, ctx: BudgetContext): string {
  const rate = formatRupiah(budget.rate);
  switch (budget.basis) {
    case "per_pax_per_day":
      return `${rate} × ${ctx.pax} orang × ${ctx.days} hari`;
    case "per_vehicle_per_day":
      return `${rate} × ${ctx.vehicleCount} mobil × ${ctx.days} hari`;
    case "per_vehicle":
      return `${rate} × ${ctx.vehicleCount} mobil`;
    case "per_day":
      return `${rate} × ${ctx.days} hari`;
    case "lump_sum":
      return rate;
  }
}
