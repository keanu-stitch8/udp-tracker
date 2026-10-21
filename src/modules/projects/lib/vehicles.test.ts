import { describe, expect, it } from "vitest";
import { flazzWalletName, uniqueName, vehicleRemoval } from "./vehicles";

describe("mobil", () => {
  it("nama dompet Flazz & nama unik", () => {
    expect(flazzWalletName("Mobil 2")).toBe("Flazz Mobil 2");
    expect(uniqueName("Flazz Mobil 2", ["Cash"])).toBe("Flazz Mobil 2");
    expect(uniqueName("Flazz Mobil 2", ["flazz mobil 2", "Flazz Mobil 2 (2)"])).toBe("Flazz Mobil 2 (3)");
  });

  it("boleh dihapus hanya jika tidak dipakai transaksi aktif dan dompet Flazz-nya kosong", () => {
    const wallets = [
      { id: "f1", vehicleId: "m1", openingBalance: 0 },
      { id: "f2", vehicleId: "m2", openingBalance: 50_000 },
      { id: "cash", vehicleId: null, openingBalance: 0 },
    ];
    const tx = (t: Partial<{ vehicleId: string | null; walletId: string; toWalletId: string | null; deletedAt: Date | null }>) => ({
      vehicleId: null,
      walletId: "cash",
      toWalletId: null,
      deletedAt: null,
      ...t,
    });
    expect(vehicleRemoval("m1", { wallets, transactions: [] })).toEqual({ allowed: true, walletIds: ["f1"] });
    expect(vehicleRemoval("m1", { wallets, transactions: [tx({ vehicleId: "m1" })] }).allowed).toBe(false);
    expect(vehicleRemoval("m1", { wallets, transactions: [tx({ vehicleId: "m1", deletedAt: new Date() })] }).allowed).toBe(true);
    expect(vehicleRemoval("m1", { wallets, transactions: [tx({ toWalletId: "f1", deletedAt: new Date() })] }).allowed).toBe(false);
    expect(vehicleRemoval("m2", { wallets, transactions: [] }).allowed).toBe(false);
  });
});
