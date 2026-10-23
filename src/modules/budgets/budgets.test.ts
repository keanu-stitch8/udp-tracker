import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { categories } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTestDb, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { createBudget, deleteBudget, updateBudget } from "./commands/save-budget";
import { getBudgetSettings } from "./queries/budget-settings";

let db: Db;
let projectId: string;
const categoryId = async (name: string) => (await getBudgetSettings(db, projectId)).categories.find((c) => c.name === name)!.id;

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] })).id;
});

describe("pengaturan pagu", () => {
  it("proyek baru tanpa pagu; pilihan kategori hanya pengeluaran", async () => {
    const settings = await getBudgetSettings(db, projectId);
    expect(settings.context).toEqual({ pax: 9, vehicleCount: 2, days: 6 });
    expect(settings.budgets).toEqual([]);
    expect(settings.categories.length).toBeGreaterThan(0);
    expect(settings.categories.every((c) => c.kind === "expense")).toBe(true);
  });

  it("buat, ubah (tarif & kategori), hapus; rumus & batas ikut", async () => {
    const snack = await categoryId("Snack & Air Minum");
    const created = await createBudget(db, projectId, { name: "Snack", rate: 20_000, basis: "per_day", categoryIds: [snack] });
    expect(created).toMatchObject({ name: "Snack", rate: 20_000, basis: "per_day", days: null, categoryIds: [snack] });
    expect((await getBudgetSettings(db, projectId)).budgets.map((b) => [b.name, b.formula, b.limit])).toEqual([["Snack", "Rp 20.000 × 6 hari", 120_000]]);

    const sarapan = await categoryId("Sarapan");
    const updated = await updateBudget(db, projectId, created.id, { name: "Snack + Sarapan", rate: 30_000, basis: "per_pax_per_day", categoryIds: [snack, sarapan] });
    expect(updated.categoryIds.sort()).toEqual([snack, sarapan].sort());
    expect((await getBudgetSettings(db, projectId)).budgets.find((b) => b.id === created.id)?.limit).toBe(30_000 * 9 * 6);

    await deleteBudget(db, projectId, created.id);
    await expect(deleteBudget(db, projectId, created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("jumlah hari per pagu: dipakai untuk batas, kosong = periode proyek, jadi jumlah trip untuk per mobil", async () => {
    const parkir = await categoryId("Parkir Harian");
    const operasional = await createBudget(db, projectId, { name: "Operasional", rate: 100_000, basis: "per_vehicle_per_day", categoryIds: [parkir] });
    expect(operasional.days).toBeNull();
    await updateBudget(db, projectId, operasional.id, { ...operasional, days: 4 });
    const updated = (await getBudgetSettings(db, projectId)).budgets.find((b) => b.id === operasional.id)!;
    expect([updated.days, updated.formula, updated.limit]).toEqual([4, "Rp 100.000 × 2 mobil × 4 hari", 800_000]);

    const tol = await createBudget(db, projectId, { name: "Tol", rate: 500_000, basis: "per_vehicle", days: 4, categoryIds: [await categoryId("Tol")] });
    expect(tol.days).toBe(4);
    expect((await getBudgetSettings(db, projectId)).budgets.find((b) => b.id === tol.id)?.limit).toBe(500_000 * 2 * 4);

    const error = await updateBudget(db, projectId, operasional.id, { ...operasional, days: 0 }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toMatchObject({ days: ["Minimal 1 hari."] });
  });

  it("tarif karyawan opsional: batas karyawan, cadangan; tidak boleh melebihi tarif management", async () => {
    const snack = await categoryId("Snack & Air Minum");
    const created = await createBudget(db, projectId, { name: "Snack", rate: 30_000, employeeRate: 20_000, basis: "per_day", categoryIds: [snack] });
    expect(created).toMatchObject({ rate: 30_000, employeeRate: 20_000 });
    const settings = await getBudgetSettings(db, projectId);
    expect(settings.budgets.map((b) => [b.limit, b.employeeLimit, b.employeeFormula])).toEqual([[180_000, 120_000, "Rp 20.000 × 6 hari"]]);
    expect(settings.total).toMatchObject({ employeeLimit: 120_000, managementLimit: 180_000, reserve: 60_000 });

    const plain = await updateBudget(db, projectId, created.id, { ...created, employeeRate: null });
    expect(plain.employeeRate).toBeNull();
    expect((await getBudgetSettings(db, projectId)).budgets[0].employeeLimit).toBe(180_000);

    const error = await updateBudget(db, projectId, created.id, { ...created, employeeRate: 40_000 }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toMatchObject({ employeeRate: ["Tarif karyawan tidak boleh lebih dari tarif management."] });
  });

  it("validasi: nama unik, kategori pengeluaran milik proyek", async () => {
    await createBudget(db, projectId, { name: "Pagu Makan", rate: 1, basis: "per_day", categoryIds: [await categoryId("Makan Siang")] });
    const udp = (await db.select().from(categories).where(and(eq(categories.projectId, projectId), eq(categories.name, "UDP Kantor"))))[0].id;
    const error = await createBudget(db, projectId, { name: "Pagu Makan", rate: -1, basis: "per_day", categoryIds: [udp] }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toMatchObject({ rate: ["Tarif tidak boleh negatif."] });
    const error2 = await createBudget(db, projectId, { name: "pagu makan", rate: 1, basis: "per_day", categoryIds: [udp] }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ name: ["Nama pagu sudah dipakai."], categoryIds: ["Pagu hanya untuk kategori pengeluaran."] });
  });

  it("proyek selesai dikunci", async () => {
    await updateProject(db, testRoot, projectId, { status: "done" });
    await expect(createBudget(db, projectId, { name: "X", rate: 1, basis: "per_day", categoryIds: [await categoryId("Sarapan")] })).rejects.toBeInstanceOf(ConflictError);
  });
});
