import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { insertProjectMembers } from "@/modules/users/api/access-repo";
import { selectUserByEmail, updateUserRow } from "@/modules/users/api/users-repo";
import type { Actor } from "@/modules/users/types/user";
import { deleteInvitation, deleteProjectMember, insertInvitation } from "../api/members-repo";
import { memberInputSchema } from "../types/member-input";
import type { AddMemberResult } from "../types/member";

/**
 * Tambah anggota lewat email (spec akses §4): akun aktif → anggota; menunggu → diaktifkan + anggota; belum pernah login →
 * undangan; ditolak → error. PM hanya bisa memberi peran anggota (peran lain di halaman Pengguna).
 */
export async function addMemberByEmail(db: Db, actor: Actor, projectId: string, input: unknown): Promise<AddMemberResult> {
  const { email } = parseOrThrow(memberInputSchema, input);
  const user = await selectUserByEmail(db, email);
  if (!user) {
    await insertInvitation(db, { projectId, email, invitedBy: actor.id });
    return { result: "invited" };
  }
  if (user.status === "rejected") throw new ValidationError({ email: ["Akun ini ditolak admin."] }, "Akun ini ditolak admin.");
  await db.transaction(async (tx) => {
    if (user.status === "pending") await updateUserRow(tx, user.id, { status: "active" });
    await insertProjectMembers(tx, [{ projectId, userId: user.id, addedBy: actor.id }]);
  });
  return { result: "member" };
}

export async function removeMember(db: Db, projectId: string, userId: string): Promise<void> {
  const removed = z.uuid().safeParse(userId).success ? await deleteProjectMember(db, projectId, userId) : 0;
  if (!removed) throw new NotFoundError("Anggota tidak ditemukan.");
}

export async function cancelInvitation(db: Db, projectId: string, email: string): Promise<void> {
  if (!(await deleteInvitation(db, projectId, email.trim().toLowerCase()))) throw new NotFoundError("Undangan tidak ditemukan.");
}
