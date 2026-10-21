import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInclusive,
  formatDateLong,
  formatDateShort,
  formatTimeTyping,
  isIsoDate,
  isoDateSchema,
  isoToLocalDate,
  isTime,
  localDateToIso,
  normalizeTime,
  nowTimeWib,
  timeSchema,
  todayWib,
} from "./date";

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

describe("kalender (Date lokal browser)", () => {
  it("ISO → Date lokal tengah malam di tanggal yang sama, dan kembali lagi", () => {
    const date = isoToLocalDate("2026-10-21");
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 21, 0]);
    expect(localDateToIso(date)).toBe("2026-10-21");
    expect(localDateToIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("jam", () => {
  it("nowTimeWib: 24 jam di Asia/Jakarta", () => {
    expect(nowTimeWib(new Date("2026-10-21T02:15:40Z"))).toBe("09:15");
    expect(nowTimeWib(new Date("2026-10-21T17:05:00Z"))).toBe("00:05");
    expect(nowTimeWib(new Date("2026-10-21T07:30:00Z"))).toBe("14:30");
  });
  it("isTime / timeSchema: HH:mm 00:00–23:59", () => {
    expect(isTime("00:00")).toBe(true);
    expect(isTime("23:59")).toBe(true);
    for (const bad of ["24:00", "9:30", "12:60", "1230", ""]) expect(isTime(bad)).toBe(false);
    expect(timeSchema.safeParse("14:30").success).toBe(true);
    expect(timeSchema.safeParse("").error?.issues[0].message).toBe("Jam wajib diisi.");
    expect(timeSchema.safeParse("25:00").error?.issues[0].message).toBe("Jam tidak valid.");
  });
  it("formatTimeTyping: hanya angka, titik dua otomatis", () => {
    expect(formatTimeTyping("1")).toBe("1");
    expect(formatTimeTyping("14")).toBe("14");
    expect(formatTimeTyping("143")).toBe("14:3");
    expect(formatTimeTyping("14:30")).toBe("14:30");
    expect(formatTimeTyping("14.305")).toBe("14:30");
  });
  it("normalizeTime: 3–4 digit jadi HH:mm, selain itu apa adanya", () => {
    expect(normalizeTime("930")).toBe("09:30");
    expect(normalizeTime("9.30")).toBe("09:30");
    expect(normalizeTime("93:0")).toBe("09:30");
    expect(normalizeTime("14:30")).toBe("14:30");
    expect(normalizeTime("2560")).toBe("2560");
    expect(normalizeTime("14")).toBe("14");
  });
});
