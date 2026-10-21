import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { getCalendarMonth, getDayDetail } from "@/modules/calendar/queries/calendar";
import { getDashboardSummary } from "@/modules/dashboard/queries/summary";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTestDb } from "@tests/helpers/test-db";
import { createTransaction, deleteTransaction, restoreTransaction, updateTransaction } from "./commands/save-transaction";
import { getLedger } from "./queries/ledger";
import { getTransactionReference, getTransactionView, listTransactionViews } from "./queries/views";

let db: Db;
let projectId: string;
let ref: { wallet: (name: string) => string; category: (name: string) => string; vehicle: (name: string) => string };

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, { name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] })).id;
  const reference = await getTransactionReference(db, projectId);
  const find = <T extends { id: string; name: string }>(list: T[]) => (name: string) => list.find((x) => x.name === name)!.id;
  ref = { wallet: find(reference.wallets), category: find(reference.categories), vehicle: find(reference.vehicles) };
});

async function seedSample() {
  await createTransaction(db, projectId, { type: "income", date: "2026-10-19", amount: 5_000_000, walletId: ref.wallet("Rekening"), categoryId: ref.category("UDP Kantor") });
  await createTransaction(db, projectId, { type: "transfer", date: "2026-10-19", amount: 1_000_000, walletId: ref.wallet("Rekening"), toWalletId: ref.wallet("Cash"), adminFee: 6_500 });
  await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", amount: 600_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Siang"), merchant: "RM Sederhana" });
  await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", amount: 900_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Malam") });
  return createTransaction(db, projectId, {
    type: "expense",
    date: "2026-10-21",
    amount: 50_000,
    walletId: ref.wallet("Flazz Mobil 1"),
    categoryId: ref.category("Tol"),
    vehicleId: ref.vehicle("Mobil 1"),
  });
}

describe("ringkasan beranda", () => {
  it("menghitung UDP, pengeluaran, sisa, saldo dompet, dan pagu makan", async () => {
    await seedSample();
    const summary = await getDashboardSummary(db, projectId);
    expect(summary.totals).toEqual({ openingTotal: 0, totalIncome: 5_000_000, udpReceived: 5_000_000, totalExpense: 1_556_500, remaining: 3_443_500 });
    expect(Object.fromEntries(summary.wallets.map((w) => [w.name, w.balance]))).toEqual({
      Rekening: 3_993_500,
      Cash: -500_000,
      "Flazz Mobil 1": -50_000,
      "Flazz Mobil 2": 0,
    });
    expect(summary.budgets.map((b) => [b.name, b.limit, b.used])).toEqual([
      ["Pagu Makan", 8_100_000, 1_500_000],
      ["Pagu Sarapan", 1_350_000, 0],
      ["BBM + Tol", 2_600_000, 50_000],
      ["Operasional Harian", 1_200_000, 0],
    ]);
    expect(summary.recent.map((t) => t.categoryName ?? "transfer")).toEqual(["Tol", "Makan Malam", "Makan Siang", "transfer", "UDP Kantor"]);
  });
});

describe("kalender", () => {
  it("total per tanggal dan detail hari", async () => {
    await seedSample();
    expect(await getCalendarMonth(db, projectId, "2026-10")).toEqual({
      month: "2026-10",
      totals: { "2026-10-19": 6_500, "2026-10-20": 1_500_000, "2026-10-21": 50_000 },
    });
    const day = await getDayDetail(db, projectId, "2026-10-20");
    expect(day.expenseTotal).toBe(1_500_000);
    expect(day.byCategory.map((c) => [c.name, c.total])).toEqual([
      ["Makan Malam", 900_000],
      ["Makan Siang", 600_000],
    ]);
    expect(day.budgets.map((b) => [b.name, b.limit, b.used])).toEqual([
      ["Pagu Makan", 1_350_000, 1_500_000],
      ["Pagu Sarapan", 225_000, 0],
      ["Operasional Harian", 200_000, 0],
    ]);
    expect(day.transactions).toHaveLength(2);
    await expect(getCalendarMonth(db, projectId, "2026-13")).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("mutasi transaksi", () => {
  it("ubah, hapus (soft), urungkan", async () => {
    const tol = await seedSample();
    const updated = await updateTransaction(db, projectId, tol.id, {
      type: "expense",
      date: "2026-10-21",
      amount: 75_000,
      walletId: ref.wallet("Flazz Mobil 1"),
      categoryId: ref.category("Tol"),
      vehicleId: ref.vehicle("Mobil 1"),
    });
    expect(updated.amount).toBe(75_000);

    await deleteTransaction(db, projectId, tol.id);
    expect((await listTransactionViews(db, projectId)).some((t) => t.id === tol.id)).toBe(false);
    await expect(getTransactionView(db, projectId, tol.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteTransaction(db, projectId, tol.id)).rejects.toBeInstanceOf(NotFoundError);

    await restoreTransaction(db, projectId, tol.id);
    expect((await getTransactionView(db, projectId, tol.id)).amount).toBe(75_000);
  });

  it("referensi proyek lain ditolak; proyek selesai dikunci", async () => {
    const other = await createProject(db, { name: "Lain", startDate: "2026-11-01", endDate: "2026-11-02", pax: 2, vehicles: [] });
    const otherCash = (await getTransactionReference(db, other.id)).wallets.find((w) => w.name === "Cash")!.id;
    await expect(
      createTransaction(db, projectId, { type: "expense", date: "2026-10-20", amount: 1, walletId: otherCash, categoryId: ref.category("Sarapan") }),
    ).rejects.toBeInstanceOf(ValidationError);

    await updateProject(db, projectId, { status: "done" });
    await expect(
      createTransaction(db, projectId, { type: "expense", date: "2026-10-20", amount: 1, walletId: ref.wallet("Cash"), categoryId: ref.category("Sarapan") }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("referensi form: dompet terakhir dipakai untuk pengeluaran", async () => {
    expect((await getTransactionReference(db, projectId)).lastWalletId).toBeNull();
    await seedSample();
    expect((await getTransactionReference(db, projectId)).lastWalletId).toBe(ref.wallet("Flazz Mobil 1"));
    expect((await getLedger(db, projectId)).transactions).toHaveLength(5);
  });
});
