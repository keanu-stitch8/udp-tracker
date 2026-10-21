import { describe, expect, it } from "vitest";
import { categories } from "@tests/helpers/ledger-fixture";
import type { Category } from "@/modules/budgets/types/category";
import { adjustmentInput, defaultAdjustmentCategoryId, describeDifference } from "./balance-check";

const named = (id: string, name: string, kind: Category["kind"], flags: Partial<Category> = {}): Category => ({
  id,
  kind,
  name,
  icon: "ellipsis",
  isVehicleRelated: false,
  isAdminFee: false,
  isOfficeFunding: false,
  archived: false,
  ...flags,
});

const seeded: Category[] = [
  named("tol", "Tol", "expense", { isVehicleRelated: true }),
  named("admin", "Biaya Admin", "expense", { isAdminFee: true }),
  named("lain", "Lain-lain", "expense"),
  named("udp", "UDP Kantor", "income", { isOfficeFunding: true }),
  named("lainnya", "Lainnya", "income"),
];

describe("cek saldo", () => {
  it("kategori bawaan: kurang → Tol (Flazz) / Lain-lain; lebih → pemasukan non-UDP", () => {
    expect(defaultAdjustmentCategoryId(-5_000, { kind: "flazz" }, seeded)).toBe("tol");
    expect(defaultAdjustmentCategoryId(-5_000, { kind: "cash" }, seeded)).toBe("lain");
    expect(defaultAdjustmentCategoryId(5_000, { kind: "cash" }, seeded)).toBe("lainnya");
  });

  it("kategori bawaan dengan fallback bila nama seed tidak ada; kategori arsip dilewati", () => {
    // fixture: tanpa "Tol"/"Lain-lain" bernama persis → pengeluaran pertama non-admin; pemasukan pertama non-UDP
    expect(defaultAdjustmentCategoryId(-1, { kind: "flazz" }, categories)).toBe("makan-siang");
    expect(defaultAdjustmentCategoryId(1, { kind: "bank" }, categories)).toBe("lainnya");
    expect(defaultAdjustmentCategoryId(1, { kind: "bank" }, [named("udp", "UDP Kantor", "income", { isOfficeFunding: true })])).toBeNull();
    expect(defaultAdjustmentCategoryId(-1, { kind: "flazz" }, [named("tol", "Tol", "expense", { archived: true }), named("x", "X", "expense")])).toBe("x");
  });

  it("input transaksi penyesuaian", () => {
    expect(adjustmentInput({ date: "2026-10-21", difference: -80_000 }, { id: "flazz1", vehicleId: "mobil1" }, { id: "tol", isVehicleRelated: true })).toEqual({
      type: "expense",
      date: "2026-10-21",
      amount: 80_000,
      categoryId: "tol",
      walletId: "flazz1",
      vehicleId: "mobil1",
      note: "Penyesuaian cek saldo",
    });
    expect(adjustmentInput({ date: "2026-10-21", difference: 25_000 }, { id: "cash", vehicleId: null }, { id: "lainnya", isVehicleRelated: false })).toMatchObject({
      type: "income",
      amount: 25_000,
      vehicleId: null,
    });
  });

  it("deskripsi selisih", () => {
    expect(describeDifference(0)).toBe("Cocok");
    expect(describeDifference(-80_000)).toBe("Kurang Rp 80.000");
    expect(describeDifference(25_000)).toBe("Lebih Rp 25.000");
  });
});
