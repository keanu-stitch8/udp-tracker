import { describe, expect, it } from "vitest";
import { canEditTransaction, canTransact, inScope } from "./scope";

describe("cakupan dompet", () => {
  it("null = semua dompet", () => {
    expect(inScope(null, "cash")).toBe(true);
    expect(canTransact(null)).toBe(true);
  });

  it("anggota hanya dompet pegangan; tanpa pegangan = hanya lihat", () => {
    expect(inScope(["cash"], "cash")).toBe(true);
    expect(inScope(["cash"], "rekening")).toBe(false);
    expect(canTransact(["cash"])).toBe(true);
    expect(canTransact([])).toBe(false);
    expect(canEditTransaction(["cash"], { walletId: "rekening" })).toBe(false);
  });
});
