import { describe, expect, it } from "vitest";
import { formatRupiah, formatRupiahCompact, parseRupiah, sum } from "./money";

describe("formatRupiah", () => {
  it("memakai titik pemisah ribuan", () => {
    expect(formatRupiah(1_350_000)).toBe("Rp 1.350.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });
  it("menaruh tanda minus di depan", () => {
    expect(formatRupiah(-2_500)).toBe("-Rp 2.500");
  });
});

describe("formatRupiahCompact", () => {
  it("meringkas untuk sel kalender", () => {
    expect(formatRupiahCompact(500)).toBe("500");
    expect(formatRupiahCompact(12_500)).toBe("12,5rb");
    expect(formatRupiahCompact(850_000)).toBe("850rb");
    expect(formatRupiahCompact(1_000_000)).toBe("1jt");
    expect(formatRupiahCompact(1_250_000)).toBe("1,3jt");
    expect(formatRupiahCompact(1_500_000_000)).toBe("1,5M");
    expect(formatRupiahCompact(-850_000)).toBe("-850rb");
  });
});

describe("parseRupiah", () => {
  it("membaca berbagai format ketikan", () => {
    expect(parseRupiah("Rp 1.350.000")).toBe(1_350_000);
    expect(parseRupiah("75.000,00")).toBe(75_000);
    expect(parseRupiah("1,350,000")).toBe(1_350_000);
    expect(parseRupiah("150000")).toBe(150_000);
  });
  it("null jika tidak ada angka", () => {
    expect(parseRupiah("")).toBeNull();
    expect(parseRupiah("Rp")).toBeNull();
  });
});

describe("sum", () => {
  it("menjumlah array angka, kosong → 0", () => {
    expect(sum([1_000, 2_500, 6_500])).toBe(10_000);
    expect(sum([])).toBe(0);
  });
});
