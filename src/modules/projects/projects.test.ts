import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { budgetCategories, budgets, categories, projects, wallets } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createTestDb } from "@tests/helpers/test-db";
import { createProject } from "./commands/create-project";
import { updateProject } from "./commands/update-project";
import { getProjectDetail, listProjects } from "./queries/projects";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

const input = { name: "Hero Kudus", location: "Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] };

describe("createProject", () => {
  it("menyimpan proyek beserta mobil, dompet, kategori, dan pagu default", async () => {
    const project = await createProject(db, input);
    expect(project).toMatchObject({ name: "Hero Kudus", location: "Kudus", pax: 9, status: "active", sheetUrl: null });

    const walletRows = await db.select().from(wallets).where(eq(wallets.projectId, project.id));
    expect(walletRows.map((w) => w.name).sort()).toEqual(["Cash", "Flazz Mobil 1", "Flazz Mobil 2", "Rekening"]);
    expect(walletRows.filter((w) => w.kind === "flazz").every((w) => w.vehicleId !== null)).toBe(true);

    const categoryRows = await db.select().from(categories).where(eq(categories.projectId, project.id));
    expect(categoryRows).toHaveLength(11);

    const [budget] = await db.select().from(budgets).where(eq(budgets.projectId, project.id));
    expect(budget).toMatchObject({ name: "Pagu Makan", rate: 150_000, basis: "per_pax_per_day" });
    const links = await db.select().from(budgetCategories).where(eq(budgetCategories.budgetId, budget.id));
    const linkedNames = categoryRows.filter((c) => links.some((l) => l.categoryId === c.id)).map((c) => c.name).sort();
    expect(linkedNames).toEqual(["Makan Malam", "Makan Siang"]);
  });

  it("input tidak valid → ValidationError dan tidak ada data tersimpan", async () => {
    const error = await createProject(db, { ...input, name: " ", endDate: "2026-10-19" }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toMatchObject({ name: ["Nama proyek wajib diisi."] });
    expect(await db.select().from(projects)).toHaveLength(0);
  });

  it("tanggal selesai sebelum mulai → error di endDate", async () => {
    const error = await createProject(db, { ...input, endDate: "2026-10-19" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ endDate: ["Tanggal selesai harus sama atau setelah tanggal mulai."] });
  });
});

describe("query proyek", () => {
  it("listProjects urut tanggal mulai terbaru; getProjectDetail berisi hari & mobil", async () => {
    await createProject(db, { ...input, name: "Lama", startDate: "2026-09-01", endDate: "2026-09-03" });
    const baru = await createProject(db, input);
    expect((await listProjects(db)).map((p) => p.name)).toEqual(["Hero Kudus", "Lama"]);
    const detail = await getProjectDetail(db, baru.id);
    expect(detail.days).toBe(6);
    expect(detail.vehicles.map((v) => v.name)).toEqual(["Mobil 1", "Mobil 2"]);
  });

  it("id tidak dikenal atau bukan uuid → NotFoundError", async () => {
    await expect(getProjectDetail(db, "bukan-uuid")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getProjectDetail(db, "7f1c4b8e-2d3a-4c5b-9e6f-0a1b2c3d4e5f")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("updateProject", () => {
  it("mengubah field dan memvalidasi tanggal terhadap data lama", async () => {
    const project = await createProject(db, input);
    expect((await updateProject(db, project.id, { pax: 10 })).pax).toBe(10);
    const error = await updateProject(db, project.id, { endDate: "2026-10-01" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ endDate: ["Tanggal selesai harus sama atau setelah tanggal mulai."] });
  });

  it("proyek selesai terkunci; hanya status yang boleh diubah (buka kembali)", async () => {
    const project = await createProject(db, input);
    await updateProject(db, project.id, { status: "done" });
    await expect(updateProject(db, project.id, { name: "Baru" })).rejects.toBeInstanceOf(ConflictError);
    expect((await updateProject(db, project.id, { status: "active" })).status).toBe("active");
  });

  it("body kosong → ValidationError", async () => {
    const project = await createProject(db, input);
    await expect(updateProject(db, project.id, {})).rejects.toBeInstanceOf(ValidationError);
  });
});
