import { describe, expect, it } from "vitest";
import { categories, groups, transactions } from "@tests/helpers/ledger-fixture";
import { expenseEntries } from "@/modules/transactions/lib/ledger";
import { categoryShares, groupShares } from "./category-share";

// Fixture: makan-malam 900.000, makan-siang 600.000, tol 50.000, admin (fee transfer) 6.500 → total 1.556.500.
const entries = expenseEntries(transactions, categories);

describe("categoryShares", () => {
  it("semua kategori, urut nominal terbesar, persen dari total pengeluaran", () => {
    expect(categoryShares(entries, categories).map((c) => [c.key, c.amount, c.share])).toEqual([
      ["makan-malam", 900_000, 58],
      ["makan-siang", 600_000, 39],
      ["tol", 50_000, 3],
      ["admin", 6_500, 0],
    ]);
  });
  it("tanpa kategori & tanpa pengeluaran", () => {
    expect(categoryShares([{ transactionId: "x", date: "2026-10-20", categoryId: null, walletId: "cash", amount: 1_000 }], categories)).toEqual([
      { key: "none", name: "Tanpa kategori", icon: null, amount: 1_000, share: 100 },
    ]);
    expect(categoryShares([], categories)).toEqual([]);
  });
});

describe("groupShares", () => {
  it("total per grup terbesar dulu, rincian kategori di dalamnya; tanpa kategori → grup Tanpa kategori", () => {
    const withNone = [...entries, { transactionId: "x", date: "2026-10-20", categoryId: null, walletId: "cash", amount: 1_000 }];
    expect(groupShares(withNone, categories, groups).map((g) => [g.name, g.amount, g.share, g.categories.map((c) => c.key)])).toEqual([
      ["Meal", 1_500_000, 96, ["makan-malam", "makan-siang"]],
      ["Transportation", 50_000, 3, ["tol"]],
      ["Lain-lain", 6_500, 0, ["admin"]],
      ["Tanpa kategori", 1_000, 0, ["none"]],
    ]);
  });
});

