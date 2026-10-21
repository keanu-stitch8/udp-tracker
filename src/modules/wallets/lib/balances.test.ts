import { describe, expect, it } from "vitest";
import { transactions, wallets } from "@tests/helpers/ledger-fixture";
import { balanceAt, dailyBalances, walletBalances } from "./balances";

describe("walletBalances", () => {
  it("saldo awal + masuk − keluar + transfer masuk − (transfer keluar + admin)", () => {
    expect(Object.fromEntries(walletBalances(wallets, transactions))).toEqual({
      rekening: 5_000_000 - 1_000_000 - 6_500,
      cash: 100_000 + 1_000_000 - 600_000 - 900_000,
      flazz1: 200_000 - 50_000,
    });
  });
  it("upTo membatasi sampai tanggal itu (inklusif)", () => {
    expect(walletBalances(wallets, transactions, "2026-10-19").get("cash")).toBe(1_100_000);
    expect(walletBalances(wallets, transactions, "2026-10-20").get("flazz1")).toBe(200_000);
  });
  it("dailyBalances: saldo akhir per tanggal yang ada mutasinya; balanceAt = saldo s/d tanggal", () => {
    const cash = wallets.find((w) => w.id === "cash")!;
    const points = dailyBalances(cash, transactions);
    expect(points).toEqual([
      { date: "2026-10-19", balance: 1_100_000 },
      { date: "2026-10-20", balance: -400_000 },
    ]);
    expect(balanceAt(points, cash.openingBalance, "2026-10-18")).toBe(0);
    expect(balanceAt(points, cash.openingBalance, "2026-10-19")).toBe(1_100_000);
    expect(balanceAt(points, cash.openingBalance, "2026-10-31")).toBe(-400_000);
    const flazz = wallets.find((w) => w.id === "flazz1")!;
    expect(balanceAt(dailyBalances(flazz, transactions), flazz.openingBalance, "2026-10-20")).toBe(walletBalances(wallets, transactions, "2026-10-20").get("flazz1"));
  });
});
