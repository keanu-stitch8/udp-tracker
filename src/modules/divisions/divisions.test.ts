import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTestDb, testDivisionId } from "@tests/helpers/test-db";
import { createDivision, deleteDivision, renameDivision } from "./commands/save-division";
import { listDivisions } from "./queries/divisions";

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
});

describe("divisi", () => {
  it("daftar A–Z dengan jumlah proyek; divisi bawaan Umum", async () => {
    await createDivision(db, { name: "MLSC" });
    const mkk = await createDivision(db, { name: " MKK " });
    expect(mkk).toEqual({ id: mkk.id, name: "MKK", projectCount: 0 });
    await createProject(db, { divisionId: mkk.id, name: "Part 1", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: [] });
    expect((await listDivisions(db)).map((d) => [d.name, d.projectCount])).toEqual([
      ["MKK", 1],
      ["MLSC", 0],
      ["Umum", 0],
    ]);
  });

  it("nama wajib dan unik tanpa beda huruf besar", async () => {
    await createDivision(db, { name: "MKK" });
    const duplicate = await createDivision(db, { name: "mkk" }).catch((e) => e);
    expect(duplicate).toBeInstanceOf(ValidationError);
    expect(duplicate.fieldErrors.name).toEqual(["Nama divisi sudah dipakai."]);
    expect(await createDivision(db, { name: " " }).catch((e) => e)).toBeInstanceOf(ValidationError);
  });

  it("ganti nama; nama sendiri boleh dipakai lagi, nama divisi lain tidak", async () => {
    const umum = await testDivisionId(db);
    await createDivision(db, { name: "MLSC" });
    expect(await renameDivision(db, umum, { name: "MKK" })).toMatchObject({ name: "MKK" });
    expect(await renameDivision(db, umum, { name: "mkk" })).toMatchObject({ name: "mkk" });
    expect(await renameDivision(db, umum, { name: "MLSC" }).catch((e) => e)).toBeInstanceOf(ValidationError);
    expect(await renameDivision(db, "bukan-uuid", { name: "X" }).catch((e) => e)).toBeInstanceOf(NotFoundError);
  });

  it("hapus hanya bila tanpa proyek", async () => {
    const umum = await testDivisionId(db);
    await createProject(db, { divisionId: umum, name: "Part 1", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: [] });
    const error = await deleteDivision(db, umum).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe("Divisi masih berisi 1 proyek. Pindahkan proyeknya dulu.");
    const kosong = await createDivision(db, { name: "MLSC" });
    await deleteDivision(db, kosong.id);
    expect((await listDivisions(db)).map((d) => d.name)).toEqual(["Umum"]);
  });
});
