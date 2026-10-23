import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { can } from "@/modules/users/lib/access";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { MenuLinks, type MenuAccess } from "../components/menu-links";

export async function MenuSection() {
  await connection();
  const db = getDb();
  const [user, project] = await Promise.all([requireCurrentUser(db), getActiveProject(db)]);
  const access: MenuAccess = { manage: can(project?.role ?? null, "manage"), root: user.isRoot, hasProject: !!project };
  return <MenuLinks user={user} access={access} />;
}
