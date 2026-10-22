import { describe, expect, it } from "vitest";
import { categories, transactions, tx, wallets } from "@tests/helpers/ledger-fixture";
import { EMPTY_FILTERS, filterTransactions, groupByDate } from "./filter";
import { toTransactionViews } from "./ledger";

const views = toTransactionViews(transactions, { wallets, categories, vehicles: [{ id: "mobil1", name: "Mobil 1", plate: null }] });
const ids = (list: { id: string }[]) => list.map((v) => v.id);

describe("filterTransactions", () => {
  it("tanpa filter → semua", () => {
    expect(filterTransactions(views, EMPTY_FILTERS)).toHaveLength(views.length);
  });
  it("jenis, kategori, mobil", () => {
    expect(ids(filterTransactions(views, { ...EMPTY_FILTERS, type: "income" }))).toEqual(["refund", "udp1"]);
    expect(ids(filterTransactions(views, { ...EMPTY_FILTERS, categoryId: "makan-siang" }))).toEqual(["siang"]);
    expect(ids(filterTransactions(views, { ...EMPTY_FILTERS, vehicleId: "mobil1" }))).toEqual(["tol1"]);
  });
  it("dompet mencocokkan asal maupun tujuan transfer", () => {
    expect(ids(filterTransactions(views, { ...EMPTY_FILTERS, walletId: "cash" }))).toEqual(["malam", "siang", "tf1", "refund"]);
  });
  it("pencarian di toko/catatan/kategori, tidak peka huruf besar", () => {
    const withMerchant = views.map((v) => (v.id === "malam" ? { ...v, merchant: "RM Sate Kerbau" } : v));
    expect(ids(filterTransactions(withMerchant, { ...EMPTY_FILTERS, q: "sate" }))).toEqual(["malam"]);
    expect(ids(filterTransactions(views, { ...EMPTY_FILTERS, q: "TOL" }))).toEqual(["tol1"]);
  });
});

describe("groupByDate", () => {
  it("kelompok per tanggal dengan subtotal pengeluaran (termasuk admin transfer)", () => {
    expect(groupByDate(views).map((g) => [g.date, g.items.length, g.expenseTotal])).toEqual([
      ["2026-10-21", 1, 50_000],
      ["2026-10-20", 2, 1_500_000],
      ["2026-10-19", 3, 6_500],
    ]);
  });
  it("subtotal mencakup biaya admin pengeluaran", () => {
    const fee = tx({ type: "expense", date: "2026-10-21", amount: 16_500, adminFee: 2_000, walletId: "rekening", categoryId: "makan-siang" });
    const withFee = toTransactionViews([...transactions, fee], { wallets, categories, vehicles: [] });
    expect(groupByDate(withFee)[0]).toMatchObject({ date: "2026-10-21", expenseTotal: 50_000 + 18_500 });
  });
});
