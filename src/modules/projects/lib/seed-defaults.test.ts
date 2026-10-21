import { describe, expect, it } from "vitest";
import { buildProjectDefaults } from "./seed-defaults";

const vehicles = [
  { id: "v1", name: "Mobil 1" },
  { id: "v2", name: "Mobil 2" },
];

describe("buildProjectDefaults", () => {
  const defaults = buildProjectDefaults(vehicles);

  it("dompet: Rekening, Cash, lalu satu Flazz per mobil", () => {
    expect(defaults.wallets).toEqual([
      { kind: "bank", name: "Rekening", vehicleId: null },
      { kind: "cash", name: "Cash", vehicleId: null },
      { kind: "flazz", name: "Flazz Mobil 1", vehicleId: "v1" },
      { kind: "flazz", name: "Flazz Mobil 2", vehicleId: "v2" },
    ]);
  });

  it("kategori sesuai spec §3.2", () => {
    const expense = defaults.categories.filter((c) => c.kind === "expense").map((c) => c.name);
    const income = defaults.categories.filter((c) => c.kind === "income").map((c) => c.name);
    expect(expense).toEqual(["Makan Siang", "Makan Malam", "Sarapan", "Snack & Air Minum", "BBM Perjalanan", "Bensin Harian", "Tol", "Parkir", "Biaya Admin", "Lain-lain"]);
    expect(income).toEqual(["UDP Kantor", "Lainnya"]);
    expect(defaults.categories.filter((c) => c.isVehicleRelated).map((c) => c.name)).toEqual(["BBM Perjalanan", "Bensin Harian", "Tol", "Parkir"]);
    expect(defaults.categories.filter((c) => c.isAdminFee).map((c) => c.name)).toEqual(["Biaya Admin"]);
    expect(defaults.categories.filter((c) => c.isOfficeFunding).map((c) => c.name)).toEqual(["UDP Kantor"]);
  });

  it("tanpa pagu bawaan — pagu diatur sendiri per proyek", () => {
    expect(defaults).not.toHaveProperty("budgets");
  });

  it("tanpa mobil → tanpa Flazz", () => {
    expect(buildProjectDefaults([]).wallets.map((w) => w.kind)).toEqual(["bank", "cash"]);
  });
});
