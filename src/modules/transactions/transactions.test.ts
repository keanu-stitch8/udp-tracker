import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { getCalendarMonth, getDayDetail } from "@/modules/calendar/queries/calendar";
import { getDashboardSummary } from "@/modules/dashboard/queries/summary";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createBudget } from "@/modules/budgets/commands/save-budget";
import { createTestDb, testDivisionId } from "@tests/helpers/test-db";
import { insertTransaction } from "./api/transactions-repo";
import { createTransaction, deleteTransaction, restoreTransaction, updateTransaction } from "./commands/save-transaction";
import { getLedger } from "./queries/ledger";
import { getTransactionReference, getTransactionView, listTransactionViews } from "./queries/views";

let db: Db;
let projectId: string;
let ref: { wallet: (name: string) => string; category: (name: string) => string; vehicle: (name: string) => string };

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, { divisionId: await testDivisionId(db), name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] })).id;
  const reference = await getTransactionReference(db, projectId);
  const find = <T extends { id: string; name: string }>(list: T[]) => (name: string) => list.find((x) => x.name === name)!.id;
  ref = { wallet: find(reference.wallets), category: find(reference.categories), vehicle: find(reference.vehicles) };
});

async function seedSample() {
  await createBudget(db, projectId, { name: "Pagu Makan", rate: 150_000, basis: "per_pax_per_day", categoryIds: [ref.category("Makan Siang"), ref.category("Makan Malam")] });
  await createTransaction(db, projectId, { type: "income", date: "2026-10-19", time: "09:00", amount: 5_000_000, walletId: ref.wallet("Rekening"), categoryId: ref.category("UDP Kantor") });
  await createTransaction(db, projectId, { type: "transfer", date: "2026-10-19", time: "09:00", amount: 1_000_000, walletId: ref.wallet("Rekening"), toWalletId: ref.wallet("Cash"), adminFee: 6_500 });
  await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 600_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Siang"), merchant: "RM Sederhana" });
  await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 900_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Malam") });
  return createTransaction(db, projectId, {
    type: "expense",
    date: "2026-10-21",
    time: "09:00",
    amount: 50_000,
    walletId: ref.wallet("Flazz Mobil 1"),
    categoryId: ref.category("Tol"),
    vehicleId: ref.vehicle("Mobil 1"),
  });
}

describe("ringkasan beranda", () => {
  it("menghitung UDP, pengeluaran, sisa, saldo dompet, tindak lanjut, per kategori; tanpa pagu", async () => {
    await seedSample();
    const summary = await getDashboardSummary(db, projectId);
    expect(summary.totals).toEqual({ openingTotal: 0, totalIncome: 5_000_000, udpReceived: 5_000_000, totalExpense: 1_556_500, remaining: 3_443_500 });
    expect(Object.fromEntries(summary.wallets.map((w) => [w.name, w.balance]))).toEqual({
      Rekening: 3_993_500,
      Cash: -500_000,
      "Flazz Mobil 1": -50_000,
      "Flazz Mobil 2": 0,
    });
    expect(summary).not.toHaveProperty("budgets");
    expect(summary.attention.map((a) => a.label)).toEqual(["3 pengeluaran belum ada bon", "Cash minus Rp 500.000", "Flazz Mobil 1 minus Rp 50.000"]);
    expect(summary.groups.map((g) => [g.name, g.amount, g.categories.map((c) => c.name)])).toEqual([
      ["Meal", 1_500_000, ["Makan Malam", "Makan Siang"]],
      ["Transportation", 50_000, ["Tol"]],
      ["Lain-lain", 6_500, ["Biaya Admin"]],
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
    expect(day.budgets.map((b) => [b.name, b.limit, b.used])).toEqual([["Pagu Makan", 1_350_000, 1_500_000]]);
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
      time: "09:00",
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
    const other = await createProject(db, { divisionId: await testDivisionId(db), name: "Lain", startDate: "2026-11-01", endDate: "2026-11-02", pax: 2, vehicles: [] });
    const otherCash = (await getTransactionReference(db, other.id)).wallets.find((w) => w.name === "Cash")!.id;
    await expect(
      createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 1, walletId: otherCash, categoryId: ref.category("Sarapan") }),
    ).rejects.toBeInstanceOf(ValidationError);

    await updateProject(db, projectId, { status: "done" });
    await expect(
      createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 1, walletId: ref.wallet("Cash"), categoryId: ref.category("Sarapan") }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("referensi form: dompet terakhir dipakai untuk pengeluaran", async () => {
    expect((await getTransactionReference(db, projectId)).lastWalletId).toBeNull();
    await seedSample();
    expect((await getTransactionReference(db, projectId)).lastWalletId).toBe(ref.wallet("Flazz Mobil 1"));
    expect((await getLedger(db, projectId)).transactions).toHaveLength(5);
  });
});

describe("jam transaksi", () => {
  it("disimpan HH:mm dan mengurutkan transaksi dalam satu tanggal", async () => {
    const base = { type: "expense" as const, date: "2026-10-20", amount: 10_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Siang") };
    await createTransaction(db, projectId, { ...base, time: "08:15", merchant: "pagi" });
    await createTransaction(db, projectId, { ...base, time: "19:40", merchant: "malam" });
    await createTransaction(db, projectId, { ...base, time: "12:05", merchant: "siang" });
    const views = await listTransactionViews(db, projectId);
    expect(views.map((v) => [v.time, v.merchant])).toEqual([
      ["19:40", "malam"],
      ["12:05", "siang"],
      ["08:15", "pagi"],
    ]);
  });

  it("jam wajib dan harus valid", async () => {
    const input = { type: "expense" as const, date: "2026-10-20", amount: 10_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Makan Siang") };
    await expect(createTransaction(db, projectId, input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createTransaction(db, projectId, { ...input, time: "25:00" })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("biaya admin", () => {
  it("pengeluaran menyimpan biaya admin; kategori Biaya Admin hanya untuk transaksi lama", async () => {
    const saved = await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 16_500, adminFee: 2_000, walletId: ref.wallet("Rekening"), categoryId: ref.category("Makan Siang") });
    expect(saved.adminFee).toBe(2_000);

    const legacy = { type: "expense", date: "2026-10-20", time: "09:00", amount: 2_500, walletId: ref.wallet("Cash"), categoryId: ref.category("Biaya Admin") } as const;
    await expect(createTransaction(db, projectId, legacy)).rejects.toBeInstanceOf(ValidationError);
    const row = await insertTransaction(db, { ...legacy, projectId });
    expect((await updateTransaction(db, projectId, row.id, { ...legacy, amount: 3_000 })).amount).toBe(3_000);
  });
});
