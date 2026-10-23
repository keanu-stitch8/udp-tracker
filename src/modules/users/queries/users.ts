import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectDivisionPms } from "../api/access-repo";
import { selectUsers } from "../api/users-repo";
import type { UserListItem, UserOption } from "../types/user-list";

/** Semua akun, urut nama (fallback email). */
export const listUsers = cache(async (db: Db): Promise<UserListItem[]> => {
  const [rows, pms] = await Promise.all([selectUsers(db), selectDivisionPms(db)]);
  return rows
    .map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      imageUrl: row.imageUrl,
      status: row.status,
      isRoot: row.isRoot,
      pmDivisionIds: pms.filter((pm) => pm.userId === row.id).map((pm) => pm.divisionId),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    }))
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, "id"));
});

/** Pool user aktif untuk pemilih PM / anggota (lintas divisi: personel bisa ditarik dari divisi lain). */
export const listActiveUsers = cache(async (db: Db): Promise<UserOption[]> =>
  (await listUsers(db)).filter((u) => u.status === "active").map(({ id, email, name, imageUrl }) => ({ id, email, name, imageUrl })),
);
