import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { listActiveUsers } from "@/modules/users/queries/users";
import { selectProjectInvitationRows, selectProjectMemberRows } from "../api/members-repo";
import type { ProjectMemberList } from "../types/member";

/**
 * Anggota (urut nama), undangan yang belum dipakai (urut email), dan kandidat dari pool user aktif lintas divisi
 * (personel kadang ditarik dari divisi lain). PM divisi dan Root tidak ikut daftar anggota: aksesnya dari peran.
 */
export const listProjectMembers = cache(async (db: Db, projectId: string): Promise<ProjectMemberList> => {
  const [members, invitations, active] = await Promise.all([selectProjectMemberRows(db, projectId), selectProjectInvitationRows(db, projectId), listActiveUsers(db)]);
  const memberIds = new Set(members.map((m) => m.userId));
  return {
    candidates: active.filter((u) => !memberIds.has(u.id)),
    members: members.sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, "id")),
    invitations: invitations.map((i) => ({ email: i.email, createdAt: i.createdAt.toISOString() })).sort((a, b) => a.email.localeCompare(b.email)),
  };
});
