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

  it("kategori sesuai spec §3.2 + grup kategori", () => {
    const expense = defaults.categories.filter((c) => c.kind === "expense").map((c) => c.name);
    const income = defaults.categories.filter((c) => c.kind === "income").map((c) => c.name);
    expect(expense).toEqual([
      "Makan Siang",
      "Makan Malam",
      "Sarapan",
      "Snack & Air Minum",
      "BBM Perjalanan",
      "Bensin Harian",
      "Tol",
      "Parkir Perjalanan",
      "Parkir Harian",
      "Biaya Admin",
      "Lain-lain",
    ]);
    expect(income).toEqual(["UDP Kantor", "Lainnya"]);
    expect(defaults.categories.filter((c) => c.isVehicleRelated).map((c) => c.name)).toEqual(["BBM Perjalanan", "Bensin Harian", "Tol", "Parkir Perjalanan", "Parkir Harian"]);
    expect(defaults.categories.filter((c) => c.isAdminFee).map((c) => c.name)).toEqual(["Biaya Admin"]);
    expect(defaults.categories.filter((c) => c.isOfficeFunding).map((c) => c.name)).toEqual(["UDP Kantor"]);
  });

  it("grup bawaan mengikuti RAB; pengeluaran wajib bergrup, pemasukan tanpa grup", () => {
    expect(defaults.groups).toEqual(["Akomodasi", "Meal", "Operasional", "Transportation", "Lain-lain"]);
    const byGroup = (group: string) => defaults.categories.filter((c) => c.group === group).map((c) => c.name);
    expect(byGroup("Akomodasi")).toEqual(["Sarapan"]);
    expect(byGroup("Meal")).toEqual(["Makan Siang", "Makan Malam"]);
    expect(byGroup("Operasional")).toEqual(["Snack & Air Minum", "Bensin Harian", "Parkir Harian"]);
    expect(byGroup("Transportation")).toEqual(["BBM Perjalanan", "Tol", "Parkir Perjalanan"]);
    expect(byGroup("Lain-lain")).toEqual(["Biaya Admin", "Lain-lain"]);
    expect(defaults.categories.filter((c) => c.kind === "income").every((c) => c.group === null)).toBe(true);
  });

  it("tanpa pagu bawaan — pagu diatur sendiri per proyek", () => {
    expect(defaults).not.toHaveProperty("budgets");
  });

  it("tanpa mobil → tanpa Flazz", () => {
    expect(buildProjectDefaults([]).wallets.map((w) => w.kind)).toEqual(["bank", "cash"]);
  });
});
