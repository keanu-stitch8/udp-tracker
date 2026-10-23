import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { budgets, categories, transactions, vehicles, wallets } from "@/db/schema";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createBudget } from "@/modules/budgets/commands/save-budget";
import { createTransaction, deleteTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { deleteReceipts } from "@/modules/receipts/api/blob";
import { createBalanceCheck } from "@/modules/wallets/commands/balance-check";
import { createTestDb, testDivisionId } from "@tests/helpers/test-db";
import { createProject } from "./commands/create-project";
import { deleteProject } from "./commands/delete-project";
import { updateProject } from "./commands/update-project";
import { listProjects } from "./queries/projects";

vi.mock("@/modules/receipts/api/blob", () => ({ putReceipt: vi.fn(), readReceipt: vi.fn(), deleteReceipts: vi.fn() }));

let passwordHash: string;
let db: Db;
const context = () => ({ ip: "9.9.9.9", passwordHash });
const input = { startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] };

beforeAll(async () => {
  passwordHash = await hash("rahasia-admin");
});
beforeEach(async () => {
  vi.clearAllMocks();
  db = await createTestDb();
});

async function seededProject(name: string) {
  const project = await createProject(db, { ...input, divisionId: await testDivisionId(db), name });
  const ref = await getTransactionReference(db, project.id);
  const cash = ref.wallets.find((w) => w.name === "Cash")!.id;
  const sarapan = ref.categories.find((c) => c.name === "Sarapan")!.id;
  await createTransaction(db, project.id, { type: "expense", date: "2026-10-20", time: "09:00", amount: 50_000, walletId: cash, categoryId: sarapan });
  const pathname = (n: number) => `receipts/${project.id}/${n}0000000-0000-4000-8000-000000000000.jpg`;
  const attachment = (n: number) => ({ pathname: pathname(n), blobUrl: `https://s.private.blob.vercel-storage.com/${pathname(n)}`, mimeType: "image/jpeg", sizeBytes: 10 });
  await createTransaction(db, project.id, { type: "expense", date: "2026-10-20", time: "09:00", amount: 20_000, walletId: cash, categoryId: sarapan, attachments: [attachment(1)] });
  const removed = await createTransaction(db, project.id, { type: "expense", date: "2026-10-21", time: "09:00", amount: 10_000, walletId: cash, categoryId: sarapan, attachments: [attachment(2)] });
  await deleteTransaction(db, project.id, removed.id);
  await createBudget(db, project.id, { name: "Pagu Sarapan", rate: 25_000, basis: "per_pax_per_day", categoryIds: [sarapan] });
  await createBalanceCheck(db, project.id, cash, { date: "2026-10-21", actualBalance: 0 });
  return { ...project, pathnames: [pathname(1), pathname(2)] };
}

const rowsOf = async (projectId: string) =>
  Promise.all(
    [transactions, wallets, categories, budgets, vehicles].map(async (table) => (await db.select().from(table).where(eq(table.projectId, projectId))).length),
  );

describe("hapus proyek", () => {
  it("password salah → ditolak dan data utuh; benar → semua data proyek terhapus, proyek lain utuh", async () => {
    const a = await seededProject("A");
    const b = await seededProject("B");

    const error = await deleteProject(db, a.id, { password: "salah" }, context()).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({ password: ["Password salah."] });
    expect((await listProjects(db)).map((p) => p.name).sort()).toEqual(["A", "B"]);
    expect(deleteReceipts).not.toHaveBeenCalled();

    await deleteProject(db, a.id, { password: "rahasia-admin" }, context());
    expect((await listProjects(db)).map((p) => p.name)).toEqual(["B"]);
    expect(await rowsOf(a.id)).toEqual([0, 0, 0, 0, 0]);
    // Termasuk foto milik transaksi yang sudah dihapus (soft delete).
    expect(vi.mocked(deleteReceipts).mock.calls).toEqual([[a.pathnames]]);
    expect((await rowsOf(b.id)).every((n) => n > 0)).toBe(true);
  });

  it("proyek selesai tetap bisa dihapus; id tidak dikenal → NotFoundError", async () => {
    const a = await seededProject("A");
    await updateProject(db, a.id, { status: "done" });
    await deleteProject(db, a.id, { password: "rahasia-admin" }, context());
    expect(await listProjects(db)).toEqual([]);
    await expect(deleteProject(db, a.id, { password: "rahasia-admin" }, context())).rejects.toBeInstanceOf(NotFoundError);
  });
});
