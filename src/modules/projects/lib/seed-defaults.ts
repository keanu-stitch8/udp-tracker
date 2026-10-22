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
  /** Nama grup (salah satu `ProjectDefaults.groups`); null untuk pemasukan. */
  group: string | null;
}

export interface ProjectDefaults {
  wallets: WalletSeed[];
  /** Grup kategori bawaan, mengikuti judul RAB. */
  groups: string[];
  categories: CategorySeed[];
}

const expense = (group: string, name: string, icon: string, flags: Partial<Pick<CategorySeed, "isVehicleRelated" | "isAdminFee">> = {}): CategorySeed => ({
  kind: "expense",
  name,
  icon,
  isVehicleRelated: flags.isVehicleRelated ?? false,
  isAdminFee: flags.isAdminFee ?? false,
  isOfficeFunding: false,
  group,
});

const income = (name: string, icon: string, isOfficeFunding = false): CategorySeed => ({
  kind: "income",
  name,
  icon,
  isVehicleRelated: false,
  isAdminFee: false,
  isOfficeFunding,
  group: null,
});

export function buildProjectDefaults(vehicles: { id: string; name: string }[]): ProjectDefaults {
  return {
    wallets: [
      { kind: "bank", name: "Rekening", vehicleId: null },
      { kind: "cash", name: "Cash", vehicleId: null },
      ...vehicles.map((vehicle) => ({ kind: "flazz" as const, name: flazzWalletName(vehicle.name), vehicleId: vehicle.id })),
    ],
    // Perjalanan (berangkat/pulang) vs harian dipisah seperti RAB: Transportation vs Operasional.
    // Snack & Air Minum: satu bon minimarket = satu transaksi, masuk Operasional (tidak dipecah per item).
    groups: ["Akomodasi", "Meal", "Operasional", "Transportation", "Lain-lain"],
    categories: [
      expense("Meal", "Makan Siang", "sandwich"),
      expense("Meal", "Makan Malam", "utensils"),
      expense("Akomodasi", "Sarapan", "coffee"),
      expense("Operasional", "Snack & Air Minum", "cup-soda"),
      expense("Transportation", "BBM Perjalanan", "fuel", { isVehicleRelated: true }),
      expense("Operasional", "Bensin Harian", "fuel", { isVehicleRelated: true }),
      expense("Transportation", "Tol", "ticket", { isVehicleRelated: true }),
      expense("Transportation", "Parkir Perjalanan", "square-parking", { isVehicleRelated: true }),
      expense("Operasional", "Parkir Harian", "square-parking", { isVehicleRelated: true }),
      expense("Lain-lain", "Biaya Admin", "landmark", { isAdminFee: true }),
      expense("Lain-lain", "Lain-lain", "ellipsis"),
      income("UDP Kantor", "building-2", true),
      income("Lainnya", "circle-plus"),
    ],
  };
}
