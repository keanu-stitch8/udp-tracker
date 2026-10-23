import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { revokeHoldingsOfUser } from "@/modules/wallets/api/holders-repo";
import { deleteMembershipsOfUser, replacePmDivisions } from "../api/access-repo";
import { countActiveRoots, selectUser, updateUserRow, type UserRow } from "../api/users-repo";
import type { Actor } from "../types/user";
import { rootInputSchema } from "../types/user-input";

// Pengguna = status akun + flag Root. Penugasan (PM per divisi, anggota per proyek) diatur di Divisi dan Anggota proyek.

export async function findUserOrThrow(db: Db, id: string): Promise<UserRow> {
  const row = z.uuid().safeParse(id).success ? await selectUser(db, id) : undefined;
  if (!row) throw new NotFoundError("Pengguna tidak ditemukan.");
  return row;
}

/** Root terakhir tidak bisa diturunkan/dicabut (spec §2); pemulihan lewat ROOT_EMAILS tetap ada. */
async function assertNotLastRoot(db: Db, user: UserRow): Promise<void> {
  if (user.isRoot && user.status === "active" && (await countActiveRoots(db)) <= 1) {
    throw new ConflictError("Ini Root terakhir. Jadikan orang lain Root dulu.");
  }
}

/** Setujui akun menunggu / akun ditolak: aktif tanpa penugasan, lalu ditambahkan sebagai PM atau anggota. */
export async function approveUser(db: Db, id: string): Promise<void> {
  await findUserOrThrow(db, id);
  await updateUserRow(db, id, { status: "active" });
}

/** Jadikan / cabut Root. Tidak menyentuh peran PM (Root boleh sekaligus PM divisi). */
export async function setUserRoot(db: Db, id: string, input: unknown): Promise<void> {
  const { isRoot } = parseOrThrow(rootInputSchema, input);
  const user = await findUserOrThrow(db, id);
  if (isRoot && user.status !== "active") throw new ConflictError("Setujui akun ini dulu.");
  if (!isRoot) await assertNotLastRoot(db, user);
  await updateUserRow(db, id, { isRoot });
}

/** Tolak akun menunggu / cabut akses akun aktif: status ditolak, Root, peran PM, dan keanggotaan proyek dihapus; pegangan dompet dicabut (riwayat tetap). */
export async function rejectUser(db: Db, actor: Actor, id: string): Promise<void> {
  const user = await findUserOrThrow(db, id);
  await assertNotLastRoot(db, user);
  await db.transaction(async (tx) => {
    await updateUserRow(tx, id, { status: "rejected", isRoot: false });
    await replacePmDivisions(tx, id, []);
    await deleteMembershipsOfUser(tx, id);
    await revokeHoldingsOfUser(tx, id, { by: actor.id, reason: "rejected" });
  });
}
