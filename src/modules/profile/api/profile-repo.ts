import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { transactions, walletHolders, wallets } from "@/db/schema";
import type { Db } from "@/db/types";

/** Proyek tempat user punya jejak (spec profil riwayat): menginput transaksi aktif, atau pernah memegang dompet. */
export async function selectTracedProjectIds(db: Db, userId: string): Promise<string[]> {
  const [input, held] = await Promise.all([
    db
      .selectDistinct({ projectId: transactions.projectId })
      .from(transactions)
      .where(and(eq(transactions.createdBy, userId), isNull(transactions.deletedAt))),
    db.selectDistinct({ projectId: wallets.projectId }).from(walletHolders).innerJoin(wallets, eq(wallets.id, walletHolders.walletId)).where(eq(walletHolders.userId, userId)),
  ]);
  return [...new Set([...input, ...held].map((r) => r.projectId))];
}
