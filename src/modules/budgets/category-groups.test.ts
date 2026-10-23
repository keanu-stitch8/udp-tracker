import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTestDb, testDivisionId } from "@tests/helpers/test-db";
import { createCategory, updateCategory } from "./commands/save-category";
import { createCategoryGroup, deleteCategoryGroup, renameCategoryGroup } from "./commands/save-category-group";
import { getCategorySettings } from "./queries/category-settings";

let db: Db;
let projectId: string;
const settings = () => getCategorySettings(db, projectId);
const groupId = async (name: string) => (await settings()).groups.find((g) => g.name === name)!.id;
const fieldErrors = (error: unknown) => (error as ValidationError).fieldErrors;

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, { divisionId: await testDivisionId(db), name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
});

describe("grup kategori", () => {
  it("proyek baru: 5 grup bawaan berurutan A–Z, Lain-lain terakhir, dengan jumlah kategori", async () => {
    expect((await settings()).groups.map((g) => [g.name, g.categoryCount])).toEqual([
      ["Akomodasi", 1],
      ["Meal", 2],
      ["Operasional", 3],
      ["Transportation", 3],
      ["Lain-lain", 2],
    ]);
  });

  it("tambah & ganti nama; nama unik tanpa beda huruf besar", async () => {
    const group = await createCategoryGroup(db, projectId, { name: "Venue" });
    expect(group.name).toBe("Venue");
    expect((await renameCategoryGroup(db, projectId, group.id, { name: "Venue & Sewa" })).name).toBe("Venue & Sewa");
    expect(fieldErrors(await createCategoryGroup(db, projectId, { name: "meal" }).catch((e) => e))).toEqual({ name: ["Nama grup sudah dipakai."] });
    expect(fieldErrors(await createCategoryGroup(db, projectId, { name: " " }).catch((e) => e))).toEqual({ name: ["Nama grup wajib diisi."] });
  });

  it("hapus grup kosong langsung; grup berisi wajib pilih grup tujuan, kategori (termasuk arsip) dipindah dulu", async () => {
    const venue = await createCategoryGroup(db, projectId, { name: "Venue" });
    const sewa = await createCategory(db, projectId, { kind: "expense", name: "Sewa Venue", icon: "building-2", groupId: venue.id });
    await updateCategory(db, projectId, sewa.id, { ...sewa, archived: true });

    expect(fieldErrors(await deleteCategoryGroup(db, projectId, venue.id).catch((e) => e))).toEqual({
      moveTo: ["Grup masih berisi 1 kategori. Pilih grup tujuan."],
    });
    expect(fieldErrors(await deleteCategoryGroup(db, projectId, venue.id, { moveTo: venue.id }).catch((e) => e))).toEqual({
      moveTo: ["Pilih grup tujuan lain."],
    });

    const akomodasi = await groupId("Akomodasi");
    await deleteCategoryGroup(db, projectId, venue.id, { moveTo: akomodasi });
    const after = await settings();
    expect(after.groups.map((g) => g.name)).not.toContain("Venue");
    expect(after.categories.find((c) => c.name === "Sewa Venue")?.groupId).toBe(akomodasi);
    await expect(deleteCategoryGroup(db, projectId, venue.id)).rejects.toBeInstanceOf(NotFoundError);

    const empty = await createCategoryGroup(db, projectId, { name: "Kosong" });
    await deleteCategoryGroup(db, projectId, empty.id);
    expect((await settings()).groups.map((g) => g.name)).not.toContain("Kosong");
  });

  it("kategori pengeluaran wajib grup milik proyek; pemasukan selalu tanpa grup", async () => {
    expect(fieldErrors(await createCategory(db, projectId, { kind: "expense", name: "Laundry", icon: "shirt" }).catch((e) => e))).toEqual({
      groupId: ["Pilih grup kategori."],
    });
    const other = (await createProject(db, { divisionId: await testDivisionId(db), name: "Lain", startDate: "2026-10-20", endDate: "2026-10-25", pax: 1, vehicles: [] })).id;
    const foreign = (await getCategorySettings(db, other)).groups[0].id;
    expect(fieldErrors(await createCategory(db, projectId, { kind: "expense", name: "Laundry", icon: "shirt", groupId: foreign }).catch((e) => e))).toEqual({
      groupId: ["Grup tidak ditemukan."],
    });

    const laundry = await createCategory(db, projectId, { kind: "expense", name: "Laundry", icon: "shirt", groupId: await groupId("Akomodasi") });
    expect(laundry.groupId).toBe(await groupId("Akomodasi"));
    const moved = await updateCategory(db, projectId, laundry.id, { ...laundry, groupId: await groupId("Operasional") });
    expect(moved.groupId).toBe(await groupId("Operasional"));

    const refund = await createCategory(db, projectId, { kind: "income", name: "Refund", icon: "circle-plus", groupId: await groupId("Meal") });
    expect(refund.groupId).toBeNull();
  });
});
