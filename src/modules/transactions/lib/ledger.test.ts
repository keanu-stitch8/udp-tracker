import { describe, expect, it } from "vitest";
import { categories, transactions, tx, wallets } from "@tests/helpers/ledger-fixture";
import { categoryUseCounts, expenseEntries, ledgerTotals, sumBy, toTransactionViews } from "./ledger";

describe("expenseEntries", () => {
  it("expense + biaya admin transfer (di kategori admin), tanpa pemasukan/nominal transfer", () => {
    expect(expenseEntries(transactions, categories).map((e) => [e.transactionId, e.categoryId, e.amount])).toEqual([
      ["tf1", "admin", 6_500],
      ["siang", "makan-siang", 600_000],
      ["malam", "makan-malam", 900_000],
      ["tol1", "tol", 50_000],
    ]);
  });
  it("tanpa kategori admin → categoryId null", () => {
    const entries = expenseEntries(transactions, categories.filter((c) => !c.isAdminFee));
    expect(entries[0]).toMatchObject({ transactionId: "tf1", categoryId: null, amount: 6_500 });
  });
  it("expense + biaya admin → dua entri: nominal di kategorinya, fee di kategori admin", () => {
    const laundry = tx({ id: "laundry", type: "expense", date: "2026-10-21", amount: 16_500, adminFee: 2_000, walletId: "rekening", categoryId: "makan-siang" });
    expect(expenseEntries([laundry], categories).map((e) => [e.transactionId, e.categoryId, e.walletId, e.amount])).toEqual([
      ["laundry", "makan-siang", "rekening", 16_500],
      ["laundry", "admin", "rekening", 2_000],
    ]);
    expect(ledgerTotals(wallets, categories, [...transactions, laundry]).totalExpense).toBe(1_556_500 + 18_500);
  });
});

describe("ledgerTotals", () => {
  it("UDP diterima, total pemasukan, pengeluaran (termasuk admin), sisa", () => {
    expect(ledgerTotals(wallets, categories, transactions)).toEqual({
      openingTotal: 200_000,
      totalIncome: 5_100_000,
      udpReceived: 5_000_000,
      totalExpense: 1_556_500,
      remaining: 200_000 + 5_100_000 - 1_556_500,
    });
  });
});

describe("sumBy", () => {
  it("mengelompokkan dan menjumlah", () => {
    const entries = expenseEntries(transactions, categories);
    expect(Object.fromEntries(sumBy(entries, (e) => e.date, (e) => e.amount))).toEqual({
      "2026-10-19": 6_500,
      "2026-10-20": 1_500_000,
      "2026-10-21": 50_000,
    });
  });
});

describe("categoryUseCounts", () => {
  it("Biaya Admin = transaksi ber-adminFee + pengeluaran lama berkategori admin", () => {
    const fee = tx({ type: "expense", date: "2026-10-21", amount: 16_500, adminFee: 2_000, walletId: "rekening", categoryId: "makan-siang" });
    const legacy = tx({ type: "expense", date: "2026-10-21", amount: 2_500, walletId: "cash", categoryId: "admin" });
    expect(Object.fromEntries(categoryUseCounts([...transactions, fee, legacy], categories))).toEqual({
      udp: 1,
      lainnya: 1,
      "makan-siang": 2,
      "makan-malam": 1,
      tol: 1,
      admin: 3,
    });
  });
});

describe("toTransactionViews", () => {
  it("menambah nama referensi dan urut terbaru dulu", () => {
    const views = toTransactionViews(transactions, { wallets, categories, vehicles: [{ id: "mobil1", name: "Mobil 1", plate: null }] });
    expect(views.map((v) => v.id)).toEqual(["tol1", "malam", "siang", "tf1", "refund", "udp1"]);
    expect(views[0]).toMatchObject({ categoryName: "tol", walletName: "flazz1", vehicleName: "Mobil 1", toWalletName: null });
    expect(views.find((v) => v.id === "tf1")).toMatchObject({ categoryName: null, walletName: "rekening", toWalletName: "cash" });
  });
  it("reimburse: transaksi yang menyentuh dompet Reimburse (talangan & penggantiannya)", () => {
    const withReimburse = [...wallets, { ...wallets[1], id: "lucky", name: "Reimburse Lucky", kind: "reimburse" as const }];
    const talangan = tx({ id: "talangan", type: "expense", date: "2026-10-10", amount: 669_800, walletId: "lucky", categoryId: "makan-siang" });
    const ganti = tx({ id: "ganti", type: "transfer", date: "2026-10-15", amount: 669_800, walletId: "rekening", toWalletId: "lucky", adminFee: 2_500 });
    const views = toTransactionViews([...transactions, talangan, ganti], { wallets: withReimburse, categories, vehicles: [] });
    expect(views.filter((v) => v.reimburse).map((v) => v.id)).toEqual(["ganti", "talangan"]);
  });
  it("tanggal sama → createdAt terbaru dulu", () => {
    const a = tx({ id: "a", type: "income", date: "2026-10-22", time: "09:00", amount: 1, walletId: "cash", createdAt: "2026-10-22T01:00:00.000Z" });
    const b = tx({ id: "b", type: "income", date: "2026-10-22", time: "09:00", amount: 1, walletId: "cash", createdAt: "2026-10-22T02:00:00.000Z" });
    expect(toTransactionViews([a, b], { wallets, categories, vehicles: [] }).map((v) => v.id)).toEqual(["b", "a"]);
  });
});
