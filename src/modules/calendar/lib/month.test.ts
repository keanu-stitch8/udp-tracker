import { describe, expect, it } from "vitest";
import { defaultCalendarMonth, formatMonthLabel, isMonth, monthGrid, monthOf, shiftMonth } from "./month";

describe("bulan", () => {
  it("validasi & navigasi", () => {
    expect(isMonth("2026-10")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("2026-1")).toBe(false);
    expect(monthOf("2026-10-21")).toBe("2026-10");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(formatMonthLabel("2026-10")).toBe("Oktober 2026");
  });

  it("grid Senin–Minggu mencakup seluruh bulan", () => {
    const october = monthGrid("2026-10");
    expect(october).toHaveLength(5);
    expect(october[0][0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(october[0][3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(october[4][6]).toEqual({ date: "2026-11-01", inMonth: false });
    const february = monthGrid("2026-02");
    expect(february[0][6]).toEqual({ date: "2026-02-01", inMonth: true });
    expect(february.at(-1)![6]).toEqual({ date: "2026-03-01", inMonth: false });
  });

  it("bulan default: bulan hari ini jika dalam periode, selain itu bulan terdekat dari periode", () => {
    expect(defaultCalendarMonth("2026-10-21", "2026-10-20", "2026-11-05")).toBe("2026-10");
    expect(defaultCalendarMonth("2026-09-01", "2026-10-20", "2026-11-05")).toBe("2026-10");
    expect(defaultCalendarMonth("2026-12-01", "2026-10-20", "2026-11-05")).toBe("2026-11");
  });
});
