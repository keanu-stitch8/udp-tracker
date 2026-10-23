import "server-only";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { deleteInvitationsByEmail, insertProjectMembers, selectInvitationsByEmail } from "../api/access-repo";
import { insertUser, selectUserByEmail, updateUserRow, type NewUserRow } from "../api/users-repo";
import { toCurrentUser } from "../mappers/user";
import type { CurrentUser } from "../types/user";

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

/**
 * Login Google (spec §3): cari/buat user dari email, perbarui profil. Email di ROOT_EMAILS → aktif + Root.
 * Undangan proyek → jadi anggota + aktif (kecuali akun ditolak: undangan tetap dihapus). Selain itu user baru `pending`.
 */
export async function signInGoogleUser(db: Db, profile: GoogleProfile, options: { rootEmails: string[]; now?: Date }): Promise<CurrentUser> {
  if (!profile.emailVerified) throw new ValidationError({ email: ["Email Google belum terverifikasi."] }, "Email Google belum terverifikasi.");
  const email = profile.email.trim().toLowerCase();
  return db.transaction(async (tx) => {
    const existing = await selectUserByEmail(tx, email);
    const patch: Partial<NewUserRow> = { name: profile.name, imageUrl: profile.picture, lastLoginAt: options.now ?? new Date() };
    let user = existing ? await updateUserRow(tx, existing.id, patch) : await insertUser(tx, { email, ...patch });
    if (options.rootEmails.includes(email)) user = await updateUserRow(tx, user.id, { status: "active", isRoot: true });

    const invitations = await selectInvitationsByEmail(tx, email);
    if (invitations.length) {
      if (user.status !== "rejected") {
        await insertProjectMembers(
          tx,
          invitations.map((i) => ({ projectId: i.projectId, userId: user.id, addedBy: i.invitedBy })),
        );
        if (user.status !== "active") user = await updateUserRow(tx, user.id, { status: "active" });
      }
      await deleteInvitationsByEmail(tx, email);
    }
    return toCurrentUser(user);
  });
}
