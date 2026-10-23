import "server-only";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { replaceDivisionPms } from "@/modules/users/api/access-repo";
import { selectUsers } from "@/modules/users/api/users-repo";
import { divisionPmsInputSchema } from "@/modules/users/types/user-input";
import { findDivisionOrThrow } from "../services/divisions";

/** Ganti daftar PM divisi (Root). Dipilih dari pool user aktif; Root boleh ikut jadi PM. */
export async function setDivisionPms(db: Db, divisionId: string, input: unknown): Promise<void> {
  await findDivisionOrThrow(db, divisionId);
  const userIds = [...new Set(parseOrThrow(divisionPmsInputSchema, input).userIds)];
  const active = new Set((await selectUsers(db)).filter((u) => u.status === "active").map((u) => u.id));
  if (userIds.some((id) => !active.has(id))) throw new ValidationError({ userIds: ["Pilih pengguna yang sudah aktif."] });
  await db.transaction((tx) => replaceDivisionPms(tx, divisionId, userIds));
}
