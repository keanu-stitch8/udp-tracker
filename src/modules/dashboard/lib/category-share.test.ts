import { describe, expect, it } from "vitest";
import { categories, groups, transactions } from "@tests/helpers/ledger-fixture";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { categoryAmounts, gaugeSegments, roundShares, udpBreakdown } from "./category-share";

// Fixture: makan-malam 900.000, makan-siang 600.000, tol 50.000, admin (fee transfer) 6.500 → total 1.556.500.
const entries = expenseEntries(transactions, categories);
const none = { transactionId: "x", date: "2026-10-20", categoryId: null, walletId: "cash", amount: 1_000 };

describe("roundShares", () => {
  it("sisa terbesar: jumlah pas target", () => {
    expect(roundShares([1, 1, 1], 3)).toEqual([34, 33, 33]);
    expect(roundShares([30, 1, 0.13, 68.87], 100)).toEqual([30, 1, 0, 69]);
    expect(roundShares([900, 600], 1000, 150)).toEqual([90, 60]);
  });
});

describe("categoryAmounts", () => {
  it("semua kategori, urut nominal terbesar; tanpa kategori → none", () => {
    expect(categoryAmounts([...entries, none], categories).map((c) => [c.key, c.amount])).toEqual([
      ["makan-malam", 900_000],
      ["makan-siang", 600_000],
      ["tol", 50_000],
      ["admin", 6_500],
      ["none", 1_000],
    ]);
    expect(categoryAmounts([], categories)).toEqual([]);
  });
});

describe("udpBreakdown", () => {
  it("persen dari UDP diterima; grup + sisa = 100; kategori berjumlah persen grup", () => {
    const udp = udpBreakdown(entries, categories, groups, 5_000_000);
    expect(udp.groups.map((g) => [g.name, g.amount, g.share, g.categories.map((c) => [c.key, c.share])])).toEqual([
      ["Meal", 1_500_000, 30, [["makan-malam", 18], ["makan-siang", 12]]],
      ["Transportation", 50_000, 1, [["tol", 1]]],
      ["Lain-lain", 6_500, 0, [["admin", 0]]],
    ]);
    expect(udp).toMatchObject({ received: 5_000_000, used: 1_556_500, remaining: 3_443_500, overBy: 0, usedShare: 31, remainingShare: 69 });
  });
  it("urutan grup A–Z, tidak ikut nominal; tanpa kategori paling bawah", () => {
    const entry = (categoryId: string, amount: number) => ({ transactionId: categoryId, date: "2026-10-20", categoryId, walletId: "cash", amount });
    const names = udpBreakdown([entry("tol", 2_000_000), entry("admin", 500_000), entry("makan-siang", 1_000), none], categories, groups, 5_000_000).groups.map((g) => g.name);
    expect(names).toEqual(["Meal", "Transportation", "Lain-lain", "Tanpa kategori"]);
  });
  it("lebih dari UDP: persen > 100, sisa 0, overBy", () => {
    expect(udpBreakdown(entries, categories, groups, 1_000_000)).toMatchObject({ remaining: 0, overBy: 556_500, usedShare: 156, remainingShare: 0 });
  });
  it("segmen gauge: berurutan; lebih dari UDP → busur penuh", () => {
    const udp = udpBreakdown(entries, categories, groups, 5_000_000);
    expect(gaugeSegments(udp).map((s) => [s.key, s.start, s.length])).toEqual([
      ["meal", 0, 30],
      ["transport", 30, 1],
      ["lain", 31, 0.13],
    ]);
    const full = gaugeSegments(udpBreakdown(entries, categories, groups, 1_000_000));
    expect(full.at(-1)!.start + full.at(-1)!.length).toBeCloseTo(100);
  });
  it("belum ada UDP: nominal tetap, persen null", () => {
    const udp = udpBreakdown(entries, categories, groups, 0);
    expect(udp).toMatchObject({ usedShare: null, remainingShare: null, overBy: 1_556_500 });
    expect(udp.groups.every((g) => g.share === null && g.categories.every((c) => c.share === null))).toBe(true);
  });
});
