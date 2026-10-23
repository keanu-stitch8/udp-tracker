import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AMOUNT, CARD_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { formatRupiah } from "@/modules/shared/lib/money";
import { TransactionRow } from "@/modules/transactions/components/transaction-row";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ProfileHeader } from "../components/profile-header";
import { ProjectHistoryCard } from "../components/project-history-card";
import { getPersonProjectHistory } from "../queries/history";
import type { PersonProjectDetail } from "../types/history";

/** Rincian riwayat satu orang di satu proyek: hanya baca, baris transaksi tanpa link edit. */
export async function ProfileProjectSection({ userId, projectId }: { userId: Promise<string>; projectId: Promise<string> }) {
  await connection();
  const db = getDb();
  const viewer = await requireCurrentUser(db);
  let detail: PersonProjectDetail;
  try {
    detail = await getPersonProjectHistory(db, viewer, await userId, await projectId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  return (
    <div className="flex flex-col gap-5">
      <ProfileHeader person={detail.person} />
      <ProjectHistoryCard summary={detail.summary} />
      {detail.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>Pengeluaran per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {detail.categories.map((c) => (
                <li key={c.categoryId ?? "none"} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className={AMOUNT}>{formatRupiah(c.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Transaksi yang diinput ({detail.transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.transactions.length ? (
            <ul className="divide-y">
              {detail.transactions.map((view) => (
                <li key={view.id}>
                  <TransactionRow view={view} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Belum ada transaksi yang diinput.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
