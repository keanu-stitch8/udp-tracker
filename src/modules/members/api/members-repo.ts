import "server-only";
import { and, eq } from "drizzle-orm";
import { projectInvitations, projectMembers, users } from "@/db/schema";
import type { Db } from "@/db/types";

export function selectProjectMemberRows(db: Db, projectId: string) {
  return db
    .select({ userId: users.id, email: users.email, name: users.name, imageUrl: users.imageUrl })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));
}

export function selectProjectInvitationRows(db: Db, projectId: string) {
  return db.select().from(projectInvitations).where(eq(projectInvitations.projectId, projectId));
}

export async function insertInvitation(db: Db, values: typeof projectInvitations.$inferInsert): Promise<void> {
  await db.insert(projectInvitations).values(values).onConflictDoNothing();
}

/** Mengembalikan jumlah baris terhapus (0 = bukan anggota). */
export async function deleteProjectMember(db: Db, projectId: string, userId: string): Promise<number> {
  const rows = await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .returning({ userId: projectMembers.userId });
  return rows.length;
}

export async function deleteInvitation(db: Db, projectId: string, email: string): Promise<number> {
  const rows = await db
    .delete(projectInvitations)
    .where(and(eq(projectInvitations.projectId, projectId), eq(projectInvitations.email, email)))
    .returning({ email: projectInvitations.email });
  return rows.length;
}
