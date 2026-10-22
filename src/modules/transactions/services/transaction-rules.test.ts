import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { planTransaction, type TransactionRefs } from "./transaction-rules";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const W = { rekening: id(1), cash: id(2), lain: id(9) };
const C = { makan: id(11), tol: id(12), udp: id(13), admin: id(14) };
const V = { mobil1: id(21) };

const refs: TransactionRefs = {
  wallets: [
    { id: W.rekening, kind: "bank", name: "Rekening", holder: null, vehicleId: null, openingBalance: 0, archived: false },
    { id: W.cash, kind: "cash", name: "Cash", holder: null, vehicleId: null, openingBalance: 0, archived: false },
  ],
  categories: [
    { id: C.makan, kind: "expense", name: "Makan Siang", icon: "sandwich", isVehicleRelated: false, isAdminFee: false, isOfficeFunding: false, archived: false },
    { id: C.tol, kind: "expense", name: "Tol", icon: "ticket", isVehicleRelated: true, isAdminFee: false, isOfficeFunding: false, archived: false },
    { id: C.udp, kind: "income", name: "UDP Kantor", icon: "building-2", isVehicleRelated: false, isAdminFee: false, isOfficeFunding: true, archived: false },
    { id: C.admin, kind: "expense", name: "Biaya Admin", icon: "landmark", isVehicleRelated: false, isAdminFee: true, isOfficeFunding: false, archived: false },
  ],
  vehicles: [{ id: V.mobil1, name: "Mobil 1", plate: null }],
};

const fieldErrorsOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationError);
    return (e as ValidationError).fieldErrors;
  }
  throw new Error("tidak melempar ValidationError");
};

describe("planTransaction", () => {
  it("pengeluaran valid; biaya admin disimpan, dompet tujuan dinolkan", () => {
    expect(
      planTransaction({ type: "expense", date: "2026-10-20", time: "09:00", amount: 75_000, categoryId: C.makan, walletId: W.cash, toWalletId: W.rekening, adminFee: 2_500, merchant: "  RM Sate  ", note: "" }, refs),
    ).toEqual({ type: "expense", date: "2026-10-20", time: "09:00", amount: 75_000, categoryId: C.makan, walletId: W.cash, toWalletId: null, adminFee: 2_500, vehicleId: null, merchant: "RM Sate", note: null });
  });

  it("transfer valid; kategori & mobil dinolkan", () => {
    expect(planTransaction({ type: "transfer", date: "2026-10-19", time: "09:00", amount: 1_000_000, walletId: W.rekening, toWalletId: W.cash, adminFee: 6_500, categoryId: C.makan }, refs)).toMatchObject({
      categoryId: null,
      vehicleId: null,
      toWalletId: W.cash,
      adminFee: 6_500,
    });
  });

  it("tol dengan mobil valid", () => {
    expect(planTransaction({ type: "expense", date: "2026-10-21", time: "09:00", amount: 50_000, categoryId: C.tol, walletId: W.cash, vehicleId: V.mobil1 }, refs).vehicleId).toBe(V.mobil1);
  });

  it("menolak input dasar yang salah", () => {
    expect(fieldErrorsOf(() => planTransaction({ type: "expense", date: "2026-02-30", time: "09:00", amount: 0, walletId: "x" }, refs))).toMatchObject({
      date: ["Tanggal tidak valid."],
      amount: ["Nominal harus lebih dari 0."],
      walletId: ["Pilih dompet."],
    });
    expect(fieldErrorsOf(() => planTransaction({ type: "expense", date: "2026-10-20", time: "09:00", amount: 1, walletId: W.cash }, refs))).toEqual({ categoryId: ["Pilih kategori."] });
  });

  it("transfer ke dompet yang sama ditolak", () => {
    expect(fieldErrorsOf(() => planTransaction({ type: "transfer", date: "2026-10-20", time: "09:00", amount: 1, walletId: W.cash, toWalletId: W.cash }, refs))).toEqual({
      toWalletId: ["Dompet tujuan harus berbeda dari dompet asal."],
    });
  });

  it("referensi harus milik proyek dan cocok dengan jenis", () => {
    expect(fieldErrorsOf(() => planTransaction({ type: "expense", date: "2026-10-20", time: "09:00", amount: 1, categoryId: C.udp, walletId: W.lain }, refs))).toEqual({
      walletId: ["Dompet tidak ditemukan di proyek ini."],
      categoryId: ["Kategori tidak cocok dengan jenis transaksi."],
    });
    expect(fieldErrorsOf(() => planTransaction({ type: "expense", date: "2026-10-20", time: "09:00", amount: 1, categoryId: C.makan, walletId: W.cash, vehicleId: V.mobil1 }, refs))).toEqual({
      vehicleId: ["Kategori ini tidak terkait mobil."],
    });
    expect(fieldErrorsOf(() => planTransaction({ type: "transfer", date: "2026-10-20", time: "09:00", amount: 1, walletId: W.cash, toWalletId: W.lain }, refs))).toEqual({
      toWalletId: ["Dompet tujuan tidak ditemukan di proyek ini."],
    });
  });

  it("pemasukan tidak boleh punya biaya admin", () => {
    expect(fieldErrorsOf(() => planTransaction({ type: "income", date: "2026-10-20", time: "09:00", amount: 1, categoryId: C.udp, walletId: W.rekening, adminFee: 2_500 }, refs))).toEqual({
      adminFee: ["Pemasukan tidak punya biaya admin."],
    });
  });

  it("pengeluaran baru berkategori Biaya Admin ditolak; transaksi lama berkategori itu tetap bisa diubah", () => {
    const input = { type: "expense", date: "2026-10-20", time: "09:00", amount: 2_500, categoryId: C.admin, walletId: W.cash };
    const message = { categoryId: ["Isi di kolom Biaya admin pada transaksi yang terkena biaya."] };
    expect(fieldErrorsOf(() => planTransaction(input, refs))).toEqual(message);
    expect(fieldErrorsOf(() => planTransaction(input, refs, { categoryId: C.makan }))).toEqual(message);
    expect(planTransaction(input, refs, { categoryId: C.admin }).categoryId).toBe(C.admin);
  });
});
