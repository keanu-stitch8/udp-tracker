import { describe, expect, it } from "vitest";
import { BASIS_LABELS, limitFormula } from "./basis";

const ctx = { pax: 9, vehicleCount: 2, days: 6 };

describe("label & rumus pagu", () => {
  it("label setiap basis", () => {
    expect(BASIS_LABELS).toEqual({
      per_pax_per_day: "per orang per hari",
      per_vehicle_per_day: "per mobil per hari",
      per_vehicle: "per mobil per trip",
      per_day: "per hari",
      lump_sum: "total sekali",
    });
  });
  it("rumus yang bisa dibaca", () => {
    expect(limitFormula({ rate: 150_000, basis: "per_pax_per_day" }, ctx)).toBe("Rp 150.000 × 9 orang × 6 hari");
    expect(limitFormula({ rate: 100_000, basis: "per_vehicle_per_day" }, ctx)).toBe("Rp 100.000 × 2 mobil × 6 hari");
    expect(limitFormula({ rate: 1_300_000, basis: "per_vehicle" }, ctx)).toBe("Rp 1.300.000 × 2 mobil");
    expect(limitFormula({ rate: 50_000, basis: "per_day" }, ctx)).toBe("Rp 50.000 × 6 hari");
    expect(limitFormula({ rate: 2_000_000, basis: "lump_sum" }, ctx)).toBe("Rp 2.000.000");
    expect(limitFormula({ rate: 100_000, basis: "per_vehicle_per_day", days: 4 }, ctx)).toBe("Rp 100.000 × 2 mobil × 4 hari");
    expect(limitFormula({ rate: 1_300_000, basis: "per_vehicle", days: 2 }, ctx)).toBe("Rp 1.300.000 × 2 mobil × 2 trip");
  });
});
