import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { createTestDb } from "@tests/helpers/test-db";
import { createBudget } from "./commands/save-budget";
import { createCategory, updateCategory } from "./commands/save-category";
import { getBudgetSettings } from "./queries/budget-settings";
import { getCategorySettings } from "./queries/category-settings";

let db: Db;
let projectId: string;
const category = async (name: string) => (await getCategorySettings(db, projectId)).categories.find((c) => c.name === name)!;

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, { name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
});

describe("kelola kategori", () => {
  it("daftar berisi pemakaian transaksi & pagu", async () => {
    const settings = await getCategorySettings(db, projectId);
    expect(settings.categories).toHaveLength(12);
    const sarapan = await category("Sarapan");
    expect([sarapan.usedCount, sarapan.budgetNames]).toEqual([0, []]);

    const cash = (await getTransactionReference(db, projectId)).wallets.find((w) => w.name === "Cash")!.id;
    await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", amount: 50_000, walletId: cash, categoryId: sarapan.id });
    await createBudget(db, projectId, { name: "Pagu Sarapan", rate: 25_000, basis: "per_pax_per_day", categoryIds: [sarapan.id] });
    expect(await category("Sarapan")).toMatchObject({ usedCount: 1, budgetNames: ["Pagu Sarapan"] });
  });

  it("tambah & ubah; jenis tidak bisa diubah", async () => {
    const hotel = await createCategory(db, projectId, { kind: "expense", name: "Hotel", icon: "bed-double" });
    expect(hotel).toMatchObject({ kind: "expense", name: "Hotel", icon: "bed-double", isVehicleRelated: false, archived: false });
    expect((await getCategorySettings(db, projectId)).categories.at(-1)?.name).toBe("Hotel");

    const renamed = await updateCategory(db, projectId, hotel.id, { ...hotel, name: "Hotel & Homestay" });
    expect(renamed.name).toBe("Hotel & Homestay");

    const error = await updateCategory(db, projectId, hotel.id, { ...hotel, kind: "income" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ kind: ["Jenis kategori tidak bisa diubah."] });
  });

  it("validasi: nama unik, ikon dari daftar, terkait mobil hanya pengeluaran", async () => {
    const error = await createCategory(db, projectId, { kind: "expense", name: "tol", icon: "ticket" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ name: ["Nama kategori sudah dipakai."] });

    const error2 = await createCategory(db, projectId, { kind: "income", name: "Refund", icon: "circle-plus", isVehicleRelated: true }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ isVehicleRelated: ["Hanya kategori pengeluaran yang bisa terkait mobil."] });

    await expect(createCategory(db, projectId, { kind: "expense", name: "X", icon: "bukan-ikon" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("arsip: hilang dari form & pilihan pagu; kategori sistem tidak bisa diarsipkan", async () => {
    const snack = await category("Snack & Air Minum");
    await updateCategory(db, projectId, snack.id, { ...snack, archived: true });
    expect((await getTransactionReference(db, projectId)).categories.some((c) => c.id === snack.id)).toBe(false);
    expect((await getBudgetSettings(db, projectId)).categories.some((c) => c.id === snack.id)).toBe(false);
    expect((await updateCategory(db, projectId, snack.id, { ...snack, archived: false })).archived).toBe(false);

    const admin = await category("Biaya Admin");
    const error = await updateCategory(db, projectId, admin.id, { ...admin, archived: true }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ archived: ["Kategori biaya admin dipakai otomatis untuk transfer, tidak bisa diarsipkan."] });
    const udp = await category("UDP Kantor");
    const error2 = await updateCategory(db, projectId, udp.id, { ...udp, archived: true }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ archived: ["Kategori UDP kantor dipakai untuk menghitung UDP diterima, tidak bisa diarsipkan."] });
    expect((await updateCategory(db, projectId, udp.id, { ...udp, name: "Transfer Kantor" })).name).toBe("Transfer Kantor");
  });

  it("id tidak dikenal → NotFoundError; proyek selesai dikunci", async () => {
    await expect(updateCategory(db, projectId, "bukan-uuid", { kind: "expense", name: "X", icon: "ellipsis" })).rejects.toBeInstanceOf(NotFoundError);
    await updateProject(db, projectId, { status: "done" });
    await expect(createCategory(db, projectId, { kind: "expense", name: "X", icon: "ellipsis" })).rejects.toBeInstanceOf(ConflictError);
  });
});
