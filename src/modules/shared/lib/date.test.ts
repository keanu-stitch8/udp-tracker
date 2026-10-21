import { describe, expect, it } from "vitest";
import { addDays, daysInclusive, formatDateLong, formatDateShort, isIsoDate, isoDateSchema, todayWib } from "./date";

describe("todayWib", () => {
  it("memakai zona Asia/Jakarta, bukan UTC", () => {
    expect(todayWib(new Date("2026-10-21T17:30:00Z"))).toBe("2026-10-22");
    expect(todayWib(new Date("2026-10-21T16:59:00Z"))).toBe("2026-10-21");
  });
});

describe("isIsoDate", () => {
  it("hanya menerima tanggal kalender yang valid", () => {
    expect(isIsoDate("2026-10-21")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("21/10/2026")).toBe(false);
    expect(isIsoDate("2026-1-5")).toBe(false);
  });
  it("tersedia sebagai zod schema", () => {
    expect(isoDateSchema.safeParse("2026-10-21").success).toBe(true);
    expect(isoDateSchema.safeParse("x").success).toBe(false);
  });
});

describe("durasi", () => {
  it("menghitung hari inklusif", () => {
    expect(daysInclusive("2026-10-20", "2026-10-25")).toBe(6);
    expect(daysInclusive("2026-10-20", "2026-10-20")).toBe(1);
    expect(daysInclusive("2026-10-30", "2026-11-02")).toBe(4);
  });
  it("menambah hari melewati batas bulan", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("format id-ID", () => {
  it("pendek dan panjang", () => {
    expect(formatDateShort("2026-10-20")).toBe("Sel, 20 Okt");
    expect(formatDateLong("2026-10-20")).toBe("20 Okt 2026");
  });
});
