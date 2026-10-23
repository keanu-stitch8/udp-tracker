import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { budgets, categories, divisionPms, projectMembers, projects, wallets } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { createProject } from "./commands/create-project";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { updateProject } from "./commands/update-project";
import { canCreateProjects, getProjectDetail, listProjects, listProjectsFor } from "./queries/projects";

const base = { name: "Hero Kudus", location: "Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1", "Mobil 2"] };
let db: Db;
let input: typeof base & { divisionId: string };
beforeEach(async () => {
  db = await createTestDb();
  input = { ...base, divisionId: await testDivisionId(db) };
});

describe("createProject", () => {
  it("menyimpan proyek beserta mobil, dompet, dan kategori; tanpa pagu bawaan", async () => {
    const project = await createProject(db, testRoot, input);
    expect(project).toMatchObject({ divisionId: input.divisionId, name: "Hero Kudus", location: "Kudus", pax: 9, status: "active", sheetUrl: null });

    const walletRows = await db.select().from(wallets).where(eq(wallets.projectId, project.id));
    expect(walletRows.map((w) => w.name).sort()).toEqual(["Cash", "Flazz Mobil 1", "Flazz Mobil 2", "Rekening"]);
    expect(walletRows.filter((w) => w.kind === "flazz").every((w) => w.vehicleId !== null)).toBe(true);

    const categoryRows = await db.select().from(categories).where(eq(categories.projectId, project.id));
    expect(categoryRows).toHaveLength(13);
    expect(categoryRows.filter((c) => c.kind === "expense").every((c) => c.groupId !== null)).toBe(true);

    expect(await db.select().from(budgets).where(eq(budgets.projectId, project.id))).toHaveLength(0);
  });

  it("input tidak valid → ValidationError dan tidak ada data tersimpan", async () => {
    const error = await createProject(db, testRoot, { ...input, name: " ", endDate: "2026-10-19" }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toMatchObject({ name: ["Nama proyek wajib diisi."] });
    expect(await db.select().from(projects)).toHaveLength(0);
  });

  it("tanggal selesai sebelum mulai → error di endDate", async () => {
    const error = await createProject(db, testRoot, { ...input, endDate: "2026-10-19" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ endDate: ["Tanggal selesai harus sama atau setelah tanggal mulai."] });
  });
});

describe("query proyek", () => {
  it("listProjects urut tanggal mulai terbaru; getProjectDetail berisi hari & mobil", async () => {
    await createProject(db, testRoot, { ...input, name: "Lama", startDate: "2026-09-01", endDate: "2026-09-03" });
    const baru = await createProject(db, testRoot, input);
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
    const project = await createProject(db, testRoot, input);
    expect((await updateProject(db, testRoot, project.id, { pax: 10 })).pax).toBe(10);
    const error = await updateProject(db, testRoot, project.id, { endDate: "2026-10-01" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ endDate: ["Tanggal selesai harus sama atau setelah tanggal mulai."] });
  });

  it("proyek selesai terkunci; hanya status yang boleh diubah (buka kembali)", async () => {
    const project = await createProject(db, testRoot, input);
    await updateProject(db, testRoot, project.id, { status: "done" });
    await expect(updateProject(db, testRoot, project.id, { name: "Baru" })).rejects.toBeInstanceOf(ConflictError);
    expect((await updateProject(db, testRoot, project.id, { status: "active" })).status).toBe("active");
  });

  it("body kosong → ValidationError", async () => {
    const project = await createProject(db, testRoot, input);
    await expect(updateProject(db, testRoot, project.id, {})).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("divisi proyek", () => {
  it("divisi wajib dan harus ada", async () => {
    const missing = await createProject(db, testRoot, { ...input, divisionId: undefined }).catch((e) => e);
    expect(missing).toBeInstanceOf(ValidationError);
    expect(missing.fieldErrors.divisionId).toEqual(["Pilih divisi."]);
    const unknown = await createProject(db, testRoot, { ...input, divisionId: "00000000-0000-4000-8000-000000000099" }).catch((e) => e);
    expect(unknown.fieldErrors.divisionId).toEqual(["Divisi tidak ditemukan."]);
    expect(await db.select().from(projects)).toHaveLength(0);
  });

  it("proyek bisa dipindah ke divisi lain", async () => {
    const project = await createProject(db, testRoot, input);
    const mlsc = await createDivision(db, { name: "MLSC" });
    expect(await updateProject(db, testRoot, project.id, { divisionId: mlsc.id })).toMatchObject({ divisionId: mlsc.id });
    expect((await updateProject(db, testRoot, project.id, { divisionId: "00000000-0000-4000-8000-000000000099" }).catch((e) => e)).fieldErrors.divisionId).toEqual(["Divisi tidak ditemukan."]);
  });

  it("hak buat/pindah proyek: PM hanya di divisinya, anggota/orang luar tidak boleh", async () => {
    const mlsc = await createDivision(db, { name: "MLSC" });
    const pm = await createTestUser(db, { email: "pm@x.id" });
    const member = await createTestUser(db, { email: "anggota@x.id" });
    await db.insert(divisionPms).values({ divisionId: input.divisionId, userId: pm.id });

    const own = await createProject(db, pm, input);
    const other = await createProject(db, pm, { ...input, divisionId: mlsc.id }).catch((e) => e);
    expect(other.fieldErrors.divisionId).toEqual(["Kamu bukan PM divisi ini."]);
    expect(await createProject(db, member, input).catch((e) => e)).toBeInstanceOf(ForbiddenError);
    expect((await updateProject(db, pm, own.id, { divisionId: mlsc.id }).catch((e) => e)).fieldErrors.divisionId).toEqual(["Kamu bukan PM divisi ini."]);
    expect(await updateProject(db, pm, own.id, { divisionId: input.divisionId, name: "Tetap" })).toMatchObject({ name: "Tetap" });

    expect(await canCreateProjects(db, pm)).toBe(true);
    expect(await canCreateProjects(db, member)).toBe(false);
    expect(await canCreateProjects(db, { ...testRoot, email: "r@x.id", name: null, imageUrl: null, status: "active" })).toBe(true);
  });
});

describe("listProjectsFor", () => {
  it("Root semua, PM proyek divisinya, anggota proyeknya, pending tidak ada", async () => {
    const mlsc = await createDivision(db, { name: "MLSC" });
    const a = await createProject(db, testRoot, { ...input, name: "A" });
    const b = await createProject(db, testRoot, { ...input, name: "B", divisionId: mlsc.id });
    const root = await createTestUser(db, { email: "root@x.id", isRoot: true });
    const pm = await createTestUser(db, { email: "pm@x.id" });
    const member = await createTestUser(db, { email: "anggota@x.id" });
    const pending = await createTestUser(db, { email: "pending@x.id", status: "pending" });
    await db.insert(divisionPms).values({ divisionId: mlsc.id, userId: pm.id });
    await db.insert(projectMembers).values([
      { projectId: a.id, userId: member.id },
      { projectId: a.id, userId: pending.id },
    ]);
    const names = async (user: Parameters<typeof listProjectsFor>[1]) => (await listProjectsFor(db, user)).map((p) => p.name).sort();
    expect(await names(root)).toEqual(["A", "B"]);
    expect(await names(pm)).toEqual(["B"]);
    expect(await names(member)).toEqual(["A"]);
    expect(await names(pending)).toEqual([]);
    expect(b.divisionId).toBe(mlsc.id);
  });
});
