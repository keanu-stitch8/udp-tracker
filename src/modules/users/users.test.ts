import { beforeEach, describe, expect, it } from "vitest";
import { divisionPms, projectInvitations, projectMembers, users } from "@/db/schema";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { CAPABILITIES, can } from "./lib/access";
import { accessibleProjectIds, projectRole } from "./services/project-role";
import { signInGoogleUser } from "./services/sign-in";

let db: Db;

beforeEach(async () => {
  db = await createTestDb();
});

const newProject = (divisionId: string, name = "Part 1") => createProject(db, testRoot, { divisionId, name, startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: [] });

describe("can", () => {
  it("tabel kemampuan spec §2", () => {
    const table = Object.fromEntries((["root", "pm", "member", null] as const).map((role) => [String(role), CAPABILITIES.filter((c) => can(role, c))]));
    expect(table).toEqual({
      root: ["view", "transact", "budgetSecret", "manage"],
      pm: ["view", "transact", "budgetSecret", "manage"],
      member: ["view", "transact"],
      null: [],
    });
  });
});

describe("projectRole", () => {
  it("root, PM divisi sendiri, PM divisi lain, anggota, bukan anggota, pending, rejected", async () => {
    const mkk = await testDivisionId(db);
    const mlsc = (await createDivision(db, { name: "MLSC" })).id;
    const project = await newProject(mkk);
    const other = await newProject(mlsc, "Bekasi");

    const root = await createTestUser(db, { email: "root@x.id", isRoot: true });
    const pm = await createTestUser(db, { email: "pm@x.id" });
    const pmLain = await createTestUser(db, { email: "pm-lain@x.id" });
    const member = await createTestUser(db, { email: "anggota@x.id" });
    const outsider = await createTestUser(db, { email: "luar@x.id" });
    const pending = await createTestUser(db, { email: "pending@x.id", status: "pending" });
    const rejected = await createTestUser(db, { email: "ditolak@x.id", status: "rejected", isRoot: true });
    await db.insert(divisionPms).values([
      { divisionId: mkk, userId: pm.id },
      { divisionId: mlsc, userId: pmLain.id },
      { divisionId: mkk, userId: pending.id },
    ]);
    await db.insert(projectMembers).values([
      { projectId: project.id, userId: member.id },
      { projectId: project.id, userId: rejected.id },
    ]);

    expect(await projectRole(db, root, project.id)).toBe("root");
    expect(await projectRole(db, pm, project.id)).toBe("pm");
    expect(await projectRole(db, pmLain, project.id)).toBeNull();
    expect(await projectRole(db, member, project.id)).toBe("member");
    expect(await projectRole(db, member, other.id)).toBeNull();
    expect(await projectRole(db, outsider, project.id)).toBeNull();
    expect(await projectRole(db, pending, project.id)).toBeNull();
    expect(await projectRole(db, rejected, project.id)).toBeNull();
    expect(await projectRole(db, root, "bukan-uuid")).toBeNull();

    expect(await accessibleProjectIds(db, root)).toBe("all");
    expect(await accessibleProjectIds(db, pm)).toEqual([project.id]);
    expect(await accessibleProjectIds(db, pmLain)).toEqual([other.id]);
    expect(await accessibleProjectIds(db, member)).toEqual([project.id]);
    expect(await accessibleProjectIds(db, outsider)).toEqual([]);
    expect(await accessibleProjectIds(db, pending)).toEqual([]);
  });
});

describe("signInGoogleUser", () => {
  const now = new Date("2026-10-23T03:00:00Z");
  const profile = (email: string) => ({ email, emailVerified: true, name: "Riski", picture: "https://lh3.example/a.png" });

  it("email di ROOT_EMAILS → aktif + Root; email disimpan huruf kecil; profil diperbarui", async () => {
    const user = await signInGoogleUser(db, profile("Riski@Example.com"), { rootEmails: ["riski@example.com"], now });
    expect(user).toMatchObject({ email: "riski@example.com", status: "active", isRoot: true, name: "Riski", imageUrl: "https://lh3.example/a.png" });
    const again = await signInGoogleUser(db, { ...profile("riski@example.com"), name: "Riski A" }, { rootEmails: [], now });
    expect(again).toMatchObject({ id: user.id, name: "Riski A", isRoot: true });
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it("user baru tanpa undangan → pending", async () => {
    expect(await signInGoogleUser(db, profile("baru@x.id"), { rootEmails: [], now })).toMatchObject({ status: "pending", isRoot: false });
  });

  it("undangan → anggota proyek + aktif, undangan dihapus", async () => {
    const project = await newProject(await testDivisionId(db));
    await db.insert(projectInvitations).values({ projectId: project.id, email: "tamu@x.id" });
    const user = await signInGoogleUser(db, profile("Tamu@x.id"), { rootEmails: [], now });
    expect(user.status).toBe("active");
    expect(await db.select({ userId: projectMembers.userId }).from(projectMembers)).toEqual([{ userId: user.id }]);
    expect(await db.select().from(projectInvitations)).toHaveLength(0);
  });

  it("rejected tetap rejected walau diundang; undangannya dihapus", async () => {
    const project = await newProject(await testDivisionId(db));
    await createTestUser(db, { email: "ditolak@x.id", status: "rejected" });
    await db.insert(projectInvitations).values({ projectId: project.id, email: "ditolak@x.id" });
    expect(await signInGoogleUser(db, profile("ditolak@x.id"), { rootEmails: [], now })).toMatchObject({ status: "rejected" });
    expect(await db.select().from(projectMembers)).toHaveLength(0);
    expect(await db.select().from(projectInvitations)).toHaveLength(0);
  });

  it("email belum terverifikasi ditolak", async () => {
    await expect(signInGoogleUser(db, { ...profile("a@x.id"), emailVerified: false }, { rootEmails: [], now })).rejects.toBeInstanceOf(ValidationError);
  });
});
