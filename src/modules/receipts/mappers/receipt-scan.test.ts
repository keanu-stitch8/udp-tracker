import { describe, expect, it } from "vitest";
import { toReceiptScan } from "./receipt-scan";

const refs = { projectYear: 2026, categoryNames: ["Tol", "Makan Siang"] };
const scan = (raw: Record<string, unknown>) => toReceiptScan({ confident: true, ...raw }, refs);

describe("toReceiptScan", () => {
  it("nominal: angka atau string rupiah Indonesia", () => {
    expect(scan({ amount: 125_500 }).amount).toBe(125_500);
    expect(scan({ amount: "Rp 125.500" }).amount).toBe(125_500);
    expect(scan({ amount: "125.500,00" }).amount).toBe(125_500);
    expect(scan({ amount: "8,000,000.00" }).amount).toBe(8_000_000);
    expect(scan({ amount: "Rp 54,000" }).amount).toBe(54_000);
  });

  it("nominal tidak masuk akal → null", () => {
    for (const amount of [0, -5_000, 100_000_001, "abc", 12.5, null]) expect(scan({ amount }).amount).toBeNull();
  });

  it("tanggal harus valid dan tahunnya ±1 dari tahun proyek", () => {
    expect(scan({ date: "2026-10-21" }).date).toBe("2026-10-21");
    expect(scan({ date: "2027-01-02" }).date).toBe("2027-01-02");
    expect(scan({ date: "2026-02-30" }).date).toBeNull();
    expect(scan({ date: "2024-10-21" }).date).toBeNull();
    expect(scan({ date: "21/10/26" }).date).toBeNull();
  });

  it("jam dinormalkan ke HH:mm 24 jam; selain itu null", () => {
    expect(scan({ time: "14:30" }).time).toBe("14:30");
    expect(scan({ time: "14.30" }).time).toBe("14:30");
    expect(scan({ time: "9:05" }).time).toBe("09:05");
    expect(scan({ time: "20:23:52" }).time).toBe("20:23");
    expect(scan({ time: "20.23.52" }).time).toBe("20:23");
    for (const time of ["25:00", "2:30 PM", "jam dua", 1430, null]) expect(scan({ time }).time).toBeNull();
  });

  it("biaya admin transfer: angka/format bank, 0–1 jt; selain itu null", () => {
    expect(scan({ adminFee: 2_500 }).adminFee).toBe(2_500);
    expect(scan({ adminFee: "Rp 2,500.00" }).adminFee).toBe(2_500);
    expect(scan({ adminFee: "6.500" }).adminFee).toBe(6_500);
    for (const adminFee of [0, -1, 1_000_001, "x", null, undefined]) expect(scan({ adminFee }).adminFee).toBeNull();
  });

  it("categoryHint harus salah satu kategori proyek (ejaan proyek)", () => {
    expect(scan({ categoryHint: "tol" }).categoryHint).toBe("Tol");
    expect(scan({ categoryHint: "Parkir" }).categoryHint).toBeNull();
  });

  it("merchant di-trim, maksimal 100 karakter, kosong → null", () => {
    expect(scan({ merchant: "  SPBU 34.123  " }).merchant).toBe("SPBU 34.123");
    expect(scan({ merchant: "x".repeat(150) }).merchant).toHaveLength(100);
    expect(scan({ merchant: "   " }).merchant).toBeNull();
  });

  it("confident hanya bila Gemini yakin dan nominal terbaca", () => {
    expect(scan({ amount: 10_000 }).confident).toBe(true);
    expect(scan({ amount: null }).confident).toBe(false);
    expect(toReceiptScan({ amount: 10_000, confident: "ya" }, refs).confident).toBe(false);
  });

  it("input aneh → semua null", () => {
    for (const raw of [null, "teks", [1, 2], 42]) {
      expect(toReceiptScan(raw, refs)).toEqual({ date: null, time: null, amount: null, adminFee: null, merchant: null, categoryHint: null, confident: false });
    }
  });
});
