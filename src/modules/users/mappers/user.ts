import type { UserRow } from "../api/users-repo";
import type { CurrentUser } from "../types/user";

export function toCurrentUser(row: UserRow): CurrentUser {
  return { id: row.id, email: row.email, name: row.name, imageUrl: row.imageUrl, status: row.status, isRoot: row.isRoot };
}
