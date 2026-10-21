// Isi awal proyek baru (spec §3.2). Murni: tanpa DB — command yang menyimpannya.
// Sengaja generik: tanpa pagu/tarif bawaan — pagu diatur sendiri per proyek.
import type { CategoryKind, WalletKind } from "@/modules/shared/types/enums";
import { flazzWalletName } from "./vehicles";

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

export interface ProjectDefaults {
  wallets: WalletSeed[];
  categories: CategorySeed[];
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

export function buildProjectDefaults(vehicles: { id: string; name: string }[]): ProjectDefaults {
  return {
    wallets: [
      { kind: "bank", name: "Rekening", vehicleId: null },
      { kind: "cash", name: "Cash", vehicleId: null },
      ...vehicles.map((vehicle) => ({ kind: "flazz" as const, name: flazzWalletName(vehicle.name), vehicleId: vehicle.id })),
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
  };
}
