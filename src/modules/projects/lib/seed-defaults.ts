// Isi awal proyek baru (spec §3.2). Murni: tanpa DB — command yang menyimpannya.
import type { BudgetBasis, CategoryKind, WalletKind } from "@/modules/shared/types/enums";

export const MEAL_RATE_PER_PAX_PER_DAY = 150_000;

export interface WalletSeed {
  kind: WalletKind;
  name: string;
  vehicleId: string | null;
}

export interface CategorySeed {
  kind: CategoryKind;
  name: string;
  icon: string;
  isVehicleRelated: boolean;
  isAdminFee: boolean;
}

export interface BudgetSeed {
  name: string;
  rate: number;
  basis: BudgetBasis;
  note: string;
  categoryNames: string[];
}

export interface ProjectDefaults {
  wallets: WalletSeed[];
  categories: CategorySeed[];
  budgets: BudgetSeed[];
}

const expense = (name: string, icon: string, flags: Partial<Pick<CategorySeed, "isVehicleRelated" | "isAdminFee">> = {}): CategorySeed => ({
  kind: "expense",
  name,
  icon,
  isVehicleRelated: flags.isVehicleRelated ?? false,
  isAdminFee: flags.isAdminFee ?? false,
});

const income = (name: string, icon: string): CategorySeed => ({ kind: "income", name, icon, isVehicleRelated: false, isAdminFee: false });

export function buildProjectDefaults(vehicles: { id: string; name: string }[]): ProjectDefaults {
  return {
    wallets: [
      { kind: "bank", name: "Rekening", vehicleId: null },
      { kind: "cash", name: "Cash", vehicleId: null },
      ...vehicles.map((vehicle) => ({ kind: "flazz" as const, name: `Flazz ${vehicle.name}`, vehicleId: vehicle.id })),
    ],
    categories: [
      expense("Makan Siang", "sandwich"),
      expense("Makan Malam", "utensils"),
      expense("Sarapan", "coffee"),
      expense("Snack & Air Minum", "cup-soda"),
      expense("BBM", "fuel", { isVehicleRelated: true }),
      expense("Tol", "ticket", { isVehicleRelated: true }),
      expense("Parkir", "square-parking", { isVehicleRelated: true }),
      expense("Biaya Admin", "landmark", { isAdminFee: true }),
      expense("Lain-lain", "ellipsis"),
      income("UDP Kantor", "building-2"),
      income("Lainnya", "circle-plus"),
    ],
    budgets: [
      {
        name: "Pagu Makan",
        rate: MEAL_RATE_PER_PAX_PER_DAY,
        basis: "per_pax_per_day",
        note: "Catatan internal. Kelebihan dari pagu ditanggung kantor.",
        categoryNames: ["Makan Siang", "Makan Malam"],
      },
    ],
  };
}
