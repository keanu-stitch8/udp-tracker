import "server-only";
import type { Db } from "@/db/types";
import { ForbiddenError } from "@/lib/errors";
import type { Role } from "@/modules/users/lib/access";
import { selectHeldWalletIds } from "../api/holders-repo";
import { inScope, OUT_OF_SCOPE_MESSAGE, type WalletScope } from "../lib/scope";

/** Siapa yang mengubah buku kas: jejak penginput + cakupan dompet. `null` = sistem/tes (tanpa jejak & batasan). */
export interface LedgerActor {
  userId: string;
  scope: WalletScope;
}

/** Root/PM bebas di semua dompet; anggota hanya dompet yang dia pegang. */
export async function walletScope(db: Db, role: Role, userId: string, projectId: string): Promise<WalletScope> {
  return role === "member" ? selectHeldWalletIds(db, projectId, userId) : null;
}

export async function ledgerActor(db: Db, access: { user: { id: string }; role: Role; projectId: string }): Promise<LedgerActor> {
  return { userId: access.user.id, scope: await walletScope(db, access.role, access.user.id, access.projectId) };
}

export function assertWalletInScope(actor: LedgerActor | null, ...walletIds: string[]): void {
  if (actor && walletIds.some((id) => !inScope(actor.scope, id))) throw new ForbiddenError(OUT_OF_SCOPE_MESSAGE);
}
