import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTransaction, deleteTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { createTestDb, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { adjustBalanceCheck, createBalanceCheck } from "./commands/balance-check";
import { createWallet, updateWallet } from "./commands/save-wallet";
import { getWalletDetail, getWalletList } from "./queries/wallets";

let db: Db;
let projectId: string;
let ref: { wallet: (name: string) => string; category: (name: string) => string; vehicle: (name: string) => string };

async function referenceOf(id: string) {
  const reference = await getTransactionReference(db, id);
  const find = <T extends { id: string; name: string }>(list: T[]) => (name: string) => list.find((x) => x.name === name)!.id;
  return { wallet: find(reference.wallets), category: find(reference.categories), vehicle: find(reference.vehicles) };
}

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 4, vehicles: ["Mobil 1"] })).id;
  ref = await referenceOf(projectId);
});

describe("kelola dompet", () => {
  it("tambah, ubah, arsip; daftar berisi saldo & nama mobil", async () => {
    const list = await getWalletList(db, projectId);
    expect(list.wallets.map((w) => [w.name, w.vehicleName])).toEqual([
      ["Rekening", null],
      ["Cash", null],
      ["Flazz Mobil 1", "Mobil 1"],
    ]);

    const gopay = await createWallet(db, projectId, { kind: "ewallet", name: "GoPay", holder: "Riski", openingBalance: 150_000 });
    expect(gopay).toMatchObject({ kind: "ewallet", name: "GoPay", holder: "Riski", vehicleId: null, openingBalance: 150_000, archived: false });
    expect((await getWalletList(db, projectId)).wallets.at(-1)).toMatchObject({ name: "GoPay", balance: 150_000 });

    const renamed = await updateWallet(db, projectId, gopay.id, { ...gopay, name: "GoPay Tim" });
    expect(renamed.name).toBe("GoPay Tim");
    const archived = await updateWallet(db, projectId, gopay.id, { ...renamed, archived: true });
    expect(archived.archived).toBe(true);
    expect((await getTransactionReference(db, projectId)).wallets.some((w) => w.id === gopay.id)).toBe(false);
  });

  it("validasi: nama unik, mobil hanya untuk Flazz & milik proyek", async () => {
    const error = await createWallet(db, projectId, { kind: "cash", name: "cash" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ name: ["Nama dompet sudah dipakai."] });

    const error2 = await createWallet(db, projectId, { kind: "cash", name: "Cash 2", vehicleId: ref.vehicle("Mobil 1") }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ vehicleId: ["Hanya dompet Flazz yang terkait mobil."] });

    const other = await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Lain", startDate: "2026-11-01", endDate: "2026-11-02", pax: 2, vehicles: ["Mobil X"] });
    const otherVehicle = (await referenceOf(other.id)).vehicle("Mobil X");
    const error3 = await createWallet(db, projectId, { kind: "flazz", name: "Flazz X", vehicleId: otherVehicle }).catch((e) => e);
    expect((error3 as ValidationError).fieldErrors).toEqual({ vehicleId: ["Mobil tidak ditemukan di proyek ini."] });

    await expect(updateWallet(db, projectId, "bukan-uuid", { kind: "cash", name: "X" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("proyek selesai dikunci", async () => {
    await updateProject(db, testRoot, projectId, { status: "done" });
    await expect(createWallet(db, projectId, { kind: "cash", name: "Cash 2" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("cek saldo", () => {
  it("snapshot saldo s/d tanggal; kurang → pengeluaran Tol + mobil di Flazz; tidak bisa dicatat dua kali", async () => {
    const flazz = ref.wallet("Flazz Mobil 1");
    await createTransaction(db, projectId, { type: "transfer", date: "2026-10-20", time: "09:00", amount: 500_000, walletId: ref.wallet("Rekening"), toWalletId: flazz });
    await createTransaction(db, projectId, { type: "expense", date: "2026-10-22", time: "09:00", amount: 30_000, walletId: flazz, categoryId: ref.category("Tol"), vehicleId: ref.vehicle("Mobil 1") });

    const check = await createBalanceCheck(db, projectId, flazz, { date: "2026-10-21", actualBalance: 420_000 });
    expect(check).toMatchObject({ walletId: flazz, date: "2026-10-21", computedBalance: 500_000, actualBalance: 420_000, difference: -80_000, adjustmentId: null });

    const adjustment = await adjustBalanceCheck(db, projectId, check.id, {});
    expect(adjustment).toMatchObject({
      type: "expense",
      date: "2026-10-21",
      time: "23:59",
      amount: 80_000,
      categoryId: ref.category("Tol"),
      walletId: flazz,
      vehicleId: ref.vehicle("Mobil 1"),
      note: "Penyesuaian cek saldo",
      balanceCheckId: check.id,
    });

    const detail = await getWalletDetail(db, projectId, flazz);
    expect(detail.checks.map((c) => [c.id, c.adjustmentId])).toEqual([[check.id, adjustment.id]]);
    expect(detail.wallet.balance).toBe(500_000 - 80_000 - 30_000);
    expect(detail.balanceHistory).toEqual([
      { date: "2026-10-20", balance: 500_000 },
      { date: "2026-10-21", balance: 420_000 },
      { date: "2026-10-22", balance: 390_000 },
    ]);

    await expect(adjustBalanceCheck(db, projectId, check.id, {})).rejects.toBeInstanceOf(ConflictError);
    await deleteTransaction(db, projectId, adjustment.id);
    expect((await adjustBalanceCheck(db, projectId, check.id, {})).amount).toBe(80_000);
  });

  it("lebih → pemasukan Lainnya; kategori pilihan divalidasi; saldo cocok → 409", async () => {
    const cash = ref.wallet("Cash");
    const plus = await createBalanceCheck(db, projectId, cash, { date: "2026-10-20", actualBalance: 25_000, note: "uang receh" });
    expect(plus).toMatchObject({ difference: 25_000, note: "uang receh" });

    const wrong = await adjustBalanceCheck(db, projectId, plus.id, { categoryId: ref.category("Sarapan") }).catch((e) => e);
    expect((wrong as ValidationError).fieldErrors).toEqual({ categoryId: ["Kategori tidak cocok dengan jenis transaksi."] });

    expect(await adjustBalanceCheck(db, projectId, plus.id, {})).toMatchObject({ type: "income", amount: 25_000, categoryId: ref.category("Lainnya"), walletId: cash, vehicleId: null });

    const even = await createBalanceCheck(db, projectId, cash, { date: "2026-10-20", actualBalance: 25_000 });
    expect(even.difference).toBe(0);
    await expect(adjustBalanceCheck(db, projectId, even.id, {})).rejects.toBeInstanceOf(ConflictError);

    await expect(createBalanceCheck(db, projectId, cash, { date: "2026-02-30", actualBalance: -1 })).rejects.toBeInstanceOf(ValidationError);
  });

  it("dompet/cek saldo proyek lain atau id tidak dikenal → NotFoundError", async () => {
    const other = await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Lain", startDate: "2026-11-01", endDate: "2026-11-02", pax: 2, vehicles: [] });
    const otherCash = (await referenceOf(other.id)).wallet("Cash");
    await expect(createBalanceCheck(db, projectId, otherCash, { date: "2026-10-20", actualBalance: 1 })).rejects.toBeInstanceOf(NotFoundError);
    const otherCheck = await createBalanceCheck(db, other.id, otherCash, { date: "2026-11-01", actualBalance: 1 });
    await expect(adjustBalanceCheck(db, projectId, otherCheck.id, {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(getWalletDetail(db, projectId, "bukan-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});
