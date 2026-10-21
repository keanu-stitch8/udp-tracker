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
  isOfficeFunding: boolean;
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
  isOfficeFunding: false,
});

const income = (name: string, icon: string, isOfficeFunding = false): CategorySeed => ({
  kind: "income",
  name,
  icon,
  isVehicleRelated: false,
  isAdminFee: false,
  isOfficeFunding,
});

/** Pagu dari surat penawaran (2026-10). Kelebihan pemakaian ditanggung kantor. */
export const OFFER_BUDGETS: BudgetSeed[] = [
  { name: "Pagu Makan", rate: MEAL_RATE_PER_PAX_PER_DAY, basis: "per_pax_per_day", note: "Makan siang + malam.", categoryNames: ["Makan Siang", "Makan Malam"] },
  { name: "Pagu Sarapan", rate: 25_000, basis: "per_pax_per_day", note: "Sarapan pagi.", categoryNames: ["Sarapan"] },
  { name: "BBM + Tol", rate: 1_300_000, basis: "per_vehicle", note: "Per mobil per trip.", categoryNames: ["BBM Perjalanan", "Tol"] },
  { name: "Operasional Harian", rate: 100_000, basis: "per_vehicle_per_day", note: "Bensin harian + parkir + lain-lain.", categoryNames: ["Bensin Harian", "Parkir", "Lain-lain"] },
];

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
      expense("BBM Perjalanan", "fuel", { isVehicleRelated: true }),
      expense("Bensin Harian", "fuel", { isVehicleRelated: true }),
      expense("Tol", "ticket", { isVehicleRelated: true }),
      expense("Parkir", "square-parking", { isVehicleRelated: true }),
      expense("Biaya Admin", "landmark", { isAdminFee: true }),
      expense("Lain-lain", "ellipsis"),
      income("UDP Kantor", "building-2", true),
      income("Lainnya", "circle-plus"),
    ],
    budgets: OFFER_BUDGETS,
  };
}
