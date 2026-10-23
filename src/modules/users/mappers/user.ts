import type { UserRow } from "../api/users-repo";
import type { CurrentUser } from "../types/user";
import type { Person } from "../types/user-list";

export function toCurrentUser(row: UserRow): CurrentUser {
  return { id: row.id, email: row.email, name: row.name, imageUrl: row.imageUrl, status: row.status, isRoot: row.isRoot };
}

export function toPerson(row: UserRow): Person {
  return { id: row.id, name: row.name ?? row.email };
}
