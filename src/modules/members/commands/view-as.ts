import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { activateProject } from "@/modules/projects/commands/activate-project";
import { selectUser } from "@/modules/users/api/users-repo";
import { encodeViewAs, VIEW_AS_COOKIE } from "@/modules/users/lib/view-as";
import { toCurrentUser } from "@/modules/users/mappers/user";
import { projectRole } from "@/modules/users/services/project-role";

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" } as const;

/** Mulai "Lihat sebagai" (spec pemegang dompet): hanya untuk anggota biasa proyek ini. Pemanggil sudah `manage`. */
export async function startViewAs(db: Db, projectId: string, userId: string): Promise<void> {
  const row = z.uuid().safeParse(userId).success ? await selectUser(db, userId) : undefined;
  if (!row || (await projectRole(db, toCurrentUser(row), projectId)) !== "member") {
    throw new ValidationError({ userId: ["Hanya bisa melihat sebagai anggota biasa proyek ini."] }, "Hanya bisa melihat sebagai anggota biasa proyek ini.");
  }
  await activateProject(db, projectId);
  (await cookies()).set(VIEW_AS_COOKIE, encodeViewAs({ projectId, userId }), cookieOptions);
}

export async function stopViewAs(): Promise<void> {
  (await cookies()).delete(VIEW_AS_COOKIE);
}
