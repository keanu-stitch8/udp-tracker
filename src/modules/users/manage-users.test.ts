import { beforeEach, describe, expect, it } from "vitest";
import { divisionPms, projectMembers } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { setDivisionPms } from "@/modules/divisions/commands/division-pms";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { approveUser, rejectUser, setUserRoot } from "./commands/manage-users";
import { listActiveUsers, listUsers } from "./queries/users";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

const find = async (id: string) => (await listUsers(db)).find((u) => u.id === id)!;

describe("kelola pengguna", () => {
  it("setujui → aktif tanpa penugasan; Root bisa sekaligus PM", async () => {
    const umum = await testDivisionId(db);
    const user = await createTestUser(db, { email: "baru@x.id", status: "pending" });
    await approveUser(db, user.id);
    expect(await find(user.id)).toMatchObject({ status: "active", isRoot: false, pmDivisionIds: [] });

    await setUserRoot(db, user.id, { isRoot: true });
    await setDivisionPms(db, umum, { userIds: [user.id] });
    expect(await find(user.id)).toMatchObject({ isRoot: true, pmDivisionIds: [umum] });
    // Cabut Root tidak menyentuh peran PM.
    await createTestUser(db, { email: "root@x.id", isRoot: true });
    await setUserRoot(db, user.id, { isRoot: false });
    expect(await find(user.id)).toMatchObject({ isRoot: false, pmDivisionIds: [umum] });
    expect(await approveUser(db, "00000000-0000-4000-8000-000000000098").catch((e) => e)).toBeInstanceOf(NotFoundError);
  });

  it("tolak/cabut: status ditolak, Root, PM, dan keanggotaan dihapus; bisa disetujui lagi", async () => {
    await createTestUser(db, { email: "root@x.id", isRoot: true });
    const umum = await testDivisionId(db);
    const project = await createProject(db, testRoot, { divisionId: umum, name: "P", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: [] });
    const user = await createTestUser(db, { email: "a@x.id", isRoot: true });
    await setDivisionPms(db, umum, { userIds: [user.id] });
    await db.insert(projectMembers).values({ projectId: project.id, userId: user.id });

    await rejectUser(db, user.id);
    expect(await find(user.id)).toMatchObject({ status: "rejected", isRoot: false, pmDivisionIds: [] });
    expect(await db.select().from(projectMembers)).toHaveLength(0);
    await approveUser(db, user.id);
    expect(await find(user.id)).toMatchObject({ status: "active" });
  });

  it("Root terakhir tidak bisa dicabut Root-nya atau ditolak; Root hanya untuk akun aktif", async () => {
    const root = await createTestUser(db, { email: "root@x.id", isRoot: true });
    expect(await setUserRoot(db, root.id, { isRoot: false }).catch((e) => e)).toBeInstanceOf(ConflictError);
    expect(await rejectUser(db, root.id).catch((e) => e)).toBeInstanceOf(ConflictError);
    const pending = await createTestUser(db, { email: "p@x.id", status: "pending" });
    expect(await setUserRoot(db, pending.id, { isRoot: true }).catch((e) => e)).toBeInstanceOf(ConflictError);
    expect(await setUserRoot(db, root.id, {}).catch((e) => e)).toBeInstanceOf(ValidationError);
    const second = await createTestUser(db, { email: "root2@x.id", isRoot: true });
    await setUserRoot(db, root.id, { isRoot: false });
    expect(await rejectUser(db, second.id).catch((e) => e)).toBeInstanceOf(ConflictError);
  });

  it("pool user aktif urut nama, tanpa pending/ditolak", async () => {
    await createTestUser(db, { email: "b@x.id", name: "Budi" });
    await createTestUser(db, { email: "a@x.id", name: "Ani" });
    await createTestUser(db, { email: "p@x.id", status: "pending" });
    await createTestUser(db, { email: "r@x.id", status: "rejected" });
    expect((await listActiveUsers(db)).map((u) => u.email)).toEqual(["a@x.id", "b@x.id"]);
  });
});

describe("PM divisi", () => {
  it("ganti daftar PM per divisi; hanya user aktif; divisi tidak ada → 404", async () => {
    const umum = await testDivisionId(db);
    const mlsc = (await createDivision(db, { name: "MLSC" })).id;
    const a = await createTestUser(db, { email: "a@x.id" });
    const b = await createTestUser(db, { email: "b@x.id" });
    const pending = await createTestUser(db, { email: "p@x.id", status: "pending" });

    await setDivisionPms(db, umum, { userIds: [a.id, b.id, a.id] });
    await setDivisionPms(db, mlsc, { userIds: [a.id] });
    await setDivisionPms(db, umum, { userIds: [b.id] });
    const rows = await db.select().from(divisionPms);
    expect(rows.map((r) => [r.divisionId === umum ? "umum" : "mlsc", r.userId === a.id ? "a" : "b"]).sort()).toEqual([
      ["mlsc", "a"],
      ["umum", "b"],
    ]);
    const invalid = await setDivisionPms(db, umum, { userIds: [pending.id] }).catch((e) => e);
    expect(invalid.fieldErrors.userIds).toEqual(["Pilih pengguna yang sudah aktif."]);
    expect(await setDivisionPms(db, "00000000-0000-4000-8000-000000000097", { userIds: [] }).catch((e) => e)).toBeInstanceOf(NotFoundError);
  });
});
