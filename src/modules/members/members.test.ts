import { beforeEach, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { addMemberByEmail, cancelInvitation, removeMember } from "./commands/members";
import { listProjectMembers } from "./queries/members";

let db: Db;
let projectId: string;
beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "P", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: [] })).id;
});

describe("anggota proyek", () => {
  it("tambah lewat email: aktif → anggota, pending → diaktifkan, belum ada → undangan, ditolak → error", async () => {
    const pm = await createTestUser(db, { email: "pm@x.id" });
    const active = await createTestUser(db, { email: "aktif@x.id", name: "Aktif" });
    const pending = await createTestUser(db, { email: "pending@x.id", status: "pending" });
    await createTestUser(db, { email: "ditolak@x.id", status: "rejected" });

    expect(await addMemberByEmail(db, pm, projectId, { email: " Aktif@X.id " })).toEqual({ result: "member" });
    expect(await addMemberByEmail(db, pm, projectId, { email: "pending@x.id" })).toEqual({ result: "member" });
    expect(await addMemberByEmail(db, pm, projectId, { email: "Baru@x.id" })).toEqual({ result: "invited" });
    const rejected = await addMemberByEmail(db, pm, projectId, { email: "ditolak@x.id" }).catch((e) => e);
    expect(rejected).toBeInstanceOf(ValidationError);
    expect(rejected.fieldErrors.email).toEqual(["Akun ini ditolak admin."]);
    expect((await addMemberByEmail(db, pm, projectId, { email: "bukan email" }).catch((e) => e)).fieldErrors.email).toBeDefined();

    // Ganda tidak dobel.
    await addMemberByEmail(db, pm, projectId, { email: "aktif@x.id" });
    await addMemberByEmail(db, pm, projectId, { email: "baru@x.id" });

    const list = await listProjectMembers(db, projectId);
    expect(list.members.map((m) => [m.email, m.name])).toEqual([
      ["aktif@x.id", "Aktif"],
      ["pending@x.id", null],
    ]);
    expect(list.invitations.map((i) => i.email)).toEqual(["baru@x.id"]);
    // Kandidat = user aktif lain (lintas divisi) yang belum anggota.
    expect(list.candidates.map((c) => c.email)).toEqual(["pm@x.id"]);
    const [pendingRow] = (await db.select().from(users)).filter((u) => u.id === pending.id);
    expect(pendingRow.status).toBe("active");
    expect(active.status).toBe("active");
  });

  it("hapus anggota dan batalkan undangan", async () => {
    const pm = await createTestUser(db, { email: "pm@x.id" });
    const member = await createTestUser(db, { email: "a@x.id" });
    await addMemberByEmail(db, pm, projectId, { email: "a@x.id" });
    await addMemberByEmail(db, pm, projectId, { email: "tamu@x.id" });
    await removeMember(db, pm, projectId, member.id);
    await cancelInvitation(db, projectId, "Tamu@x.id");
    expect(await listProjectMembers(db, projectId)).toMatchObject({ members: [], invitations: [] });
    await expect(removeMember(db, pm, projectId, member.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(cancelInvitation(db, projectId, "tamu@x.id")).rejects.toBeInstanceOf(NotFoundError);
  });
});
