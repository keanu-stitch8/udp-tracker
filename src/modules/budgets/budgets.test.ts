import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { budgets, categories } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTestDb } from "@tests/helpers/test-db";
import { applyDefaultBudgets, createBudget, deleteBudget, updateBudget } from "./commands/save-budget";
import { getBudgetSettings } from "./queries/budget-settings";

let db: Db;
let projectId: string;
const categoryId = async (name: string) => (await getBudgetSettings(db, projectId)).categories.find((c) => c.name === name)!.id;

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, { name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] })).id;
});

describe("pengaturan pagu", () => {
  it("menampilkan pagu dengan rumus, batas, dan hanya kategori pengeluaran", async () => {
    const settings = await getBudgetSettings(db, projectId);
    expect(settings.context).toEqual({ pax: 9, vehicleCount: 2, days: 6 });
    expect(settings.budgets.map((b) => [b.name, b.formula, b.limit])).toEqual([
      ["Pagu Makan", "Rp 150.000 × 9 orang × 6 hari", 8_100_000],
      ["Pagu Sarapan", "Rp 25.000 × 9 orang × 6 hari", 1_350_000],
      ["BBM + Tol", "Rp 1.300.000 × 2 mobil", 2_600_000],
      ["Operasional Harian", "Rp 100.000 × 2 mobil × 6 hari", 1_200_000],
    ]);
    expect(settings.categories.every((c) => c.kind === "expense")).toBe(true);
  });

  it("buat, ubah (tarif & kategori), hapus", async () => {
    const snack = await categoryId("Snack & Air Minum");
    const created = await createBudget(db, projectId, { name: "Snack", rate: 20_000, basis: "per_day", categoryIds: [snack] });
    expect(created).toMatchObject({ name: "Snack", rate: 20_000, basis: "per_day", categoryIds: [snack] });

    const sarapan = await categoryId("Sarapan");
    const updated = await updateBudget(db, projectId, created.id, { name: "Snack + Sarapan", rate: 30_000, basis: "per_pax_per_day", categoryIds: [snack, sarapan] });
    expect(updated.categoryIds.sort()).toEqual([snack, sarapan].sort());
    expect((await getBudgetSettings(db, projectId)).budgets.find((b) => b.id === created.id)?.limit).toBe(30_000 * 9 * 6);

    await deleteBudget(db, projectId, created.id);
    await expect(deleteBudget(db, projectId, created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("validasi: nama unik, kategori pengeluaran milik proyek", async () => {
    const udp = (await db.select().from(categories).where(and(eq(categories.projectId, projectId), eq(categories.name, "UDP Kantor"))))[0].id;
    const error = await createBudget(db, projectId, { name: "Pagu Makan", rate: -1, basis: "per_day", categoryIds: [udp] }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toMatchObject({ rate: ["Tarif tidak boleh negatif."] });
    const error2 = await createBudget(db, projectId, { name: "Pagu Makan", rate: 1, basis: "per_day", categoryIds: [udp] }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ name: ["Nama pagu sudah dipakai."], categoryIds: ["Pagu hanya untuk kategori pengeluaran."] });
  });

  it("jumlah hari per pagu: dipakai untuk batas, kosong = periode proyek, diabaikan untuk basis non-harian", async () => {
    const operasional = (await getBudgetSettings(db, projectId)).budgets.find((b) => b.name === "Operasional Harian")!;
    expect(operasional.days).toBeNull();
    await updateBudget(db, projectId, operasional.id, { ...operasional, days: 4 });
    const updated = (await getBudgetSettings(db, projectId)).budgets.find((b) => b.id === operasional.id)!;
    expect([updated.days, updated.formula, updated.limit]).toEqual([4, "Rp 100.000 × 2 mobil × 4 hari", 800_000]);

    const bbm = (await getBudgetSettings(db, projectId)).budgets.find((b) => b.name === "BBM + Tol")!;
    expect((await updateBudget(db, projectId, bbm.id, { ...bbm, days: 4 })).days).toBeNull();

    const error = await updateBudget(db, projectId, operasional.id, { ...operasional, days: 0 }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toMatchObject({ days: ["Minimal 1 hari."] });
  });

  it("proyek selesai dikunci", async () => {
    await updateProject(db, projectId, { status: "done" });
    await expect(createBudget(db, projectId, { name: "X", rate: 1, basis: "per_day", categoryIds: [await categoryId("Sarapan")] })).rejects.toBeInstanceOf(ConflictError);
  });

  it("applyDefaultBudgets meng-upgrade proyek lama tanpa duplikasi", async () => {
    // simulasikan proyek versi lama: BBM tunggal, tanpa Bensin Harian, hanya Pagu Makan
    await db.update(categories).set({ name: "BBM" }).where(and(eq(categories.projectId, projectId), eq(categories.name, "BBM Perjalanan")));
    await db.delete(categories).where(and(eq(categories.projectId, projectId), eq(categories.name, "Bensin Harian")));
    for (const name of ["Pagu Sarapan", "BBM + Tol", "Operasional Harian"]) await db.delete(budgets).where(and(eq(budgets.projectId, projectId), eq(budgets.name, name)));

    const result = await applyDefaultBudgets(db, projectId);
    expect(result).toEqual({ renamed: ["BBM → BBM Perjalanan"], addedCategories: ["Bensin Harian"], addedBudgets: ["Pagu Sarapan", "BBM + Tol", "Operasional Harian"] });

    const settings = await getBudgetSettings(db, projectId);
    expect(settings.budgets.map((b) => b.name)).toEqual(["Pagu Makan", "Pagu Sarapan", "BBM + Tol", "Operasional Harian"]);
    const names = new Map(settings.categories.map((c) => [c.id, c.name]));
    expect(settings.budgets.find((b) => b.name === "Operasional Harian")!.categoryIds.map((id) => names.get(id))).toEqual(["Bensin Harian", "Parkir", "Lain-lain"]);
    expect(settings.categories.map((c) => c.name).slice(0, 7)).toEqual(["Makan Siang", "Makan Malam", "Sarapan", "Snack & Air Minum", "BBM Perjalanan", "Bensin Harian", "Tol"]);

    expect(await applyDefaultBudgets(db, projectId)).toEqual({ renamed: [], addedCategories: [], addedBudgets: [] });
  });
});
