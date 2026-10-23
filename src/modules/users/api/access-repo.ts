import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { divisionPms, projectInvitations, projectMembers, projects, walletHolders } from "@/db/schema";
import type { Db } from "@/db/types";

// Tabel hak akses: PM per divisi, anggota per proyek, undangan per email.

export async function selectPmDivisionIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ divisionId: divisionPms.divisionId }).from(divisionPms).where(eq(divisionPms.userId, userId));
  return rows.map((r) => r.divisionId);
}

export function selectDivisionPms(db: Db): Promise<{ divisionId: string; userId: string }[]> {
  return db.select().from(divisionPms);
}

export async function replacePmDivisions(db: Db, userId: string, divisionIds: string[]): Promise<void> {
  await db.delete(divisionPms).where(eq(divisionPms.userId, userId));
  if (divisionIds.length) await db.insert(divisionPms).values(divisionIds.map((divisionId) => ({ divisionId, userId })));
}

export async function isPmOfProjectDivision(db: Db, userId: string, projectId: string): Promise<boolean> {
  const [row] = await db
    .select({ projectId: projects.id })
    .from(projects)
    .innerJoin(divisionPms, and(eq(divisionPms.divisionId, projects.divisionId), eq(divisionPms.userId, userId)))
    .where(eq(projects.id, projectId));
  return !!row;
}

export async function isProjectMember(db: Db, userId: string, projectId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)));
  return !!row;
}

export async function selectMemberProjectIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db.select({ projectId: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.userId, userId));
  return rows.map((r) => r.projectId);
}

export async function selectProjectIdsInDivisions(db: Db, divisionIds: string[]): Promise<string[]> {
  if (!divisionIds.length) return [];
  const rows = await db.select({ id: projects.id }).from(projects).where(inArray(projects.divisionId, divisionIds));
  return rows.map((r) => r.id);
}

export async function insertProjectMembers(db: Db, values: (typeof projectMembers.$inferInsert)[]): Promise<void> {
  if (values.length) await db.insert(projectMembers).values(values).onConflictDoNothing();
}

/** Keanggotaan semua proyek beserta pegangan dompetnya. */
export async function deleteMembershipsOfUser(db: Db, userId: string): Promise<void> {
  await db.delete(projectMembers).where(eq(projectMembers.userId, userId));
  await db.delete(walletHolders).where(eq(walletHolders.userId, userId));
}

export function selectInvitationsByEmail(db: Db, email: string): Promise<(typeof projectInvitations.$inferSelect)[]> {
  return db.select().from(projectInvitations).where(eq(projectInvitations.email, email));
}

export async function deleteInvitationsByEmail(db: Db, email: string): Promise<void> {
  await db.delete(projectInvitations).where(eq(projectInvitations.email, email));
}

export async function replaceDivisionPms(db: Db, divisionId: string, userIds: string[]): Promise<void> {
  await db.delete(divisionPms).where(eq(divisionPms.divisionId, divisionId));
  if (userIds.length) await db.insert(divisionPms).values(userIds.map((userId) => ({ divisionId, userId })));
}
