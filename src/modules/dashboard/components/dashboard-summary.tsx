"use client";

import { Landmark, Receipt } from "lucide-react";
import Link from "next/link";
import { AMOUNT, CARD_TITLE, LABEL } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { TransactionRow } from "@/modules/transactions/components/transaction-row";
import { reimburseStatus } from "@/modules/wallets/lib/reimburse";
import { useDashboardSummary } from "../hooks/use-summary";
import { BudgetTotalTile } from "./budget-total";
import { GroupBreakdown } from "./group-breakdown";
import { StatTile } from "./stat-tile";

export function DashboardSummaryView({ projectId }: { projectId: string }) {
  const { data } = useDashboardSummary(projectId);
  if (!data) return null;
  const { totals } = data;

  // Urutan pilihan pengguna: pemakaian UDP per grup, total pagu (Root/PM), sisa, UDP & pengeluaran, dompet, transaksi terakhir.
  return (
    <div className="flex flex-col gap-4">
      <GroupBreakdown data={data.udp} />

      {data.budget && <BudgetTotalTile {...data.budget} />}

      <Card className="bg-primary">
        <CardContent className="py-3">
          <p className={LABEL}>{totals.remaining >= 0 ? "Sisa (dikembalikan ke kantor)" : "Kurang (perlu reimburse)"}</p>
          <p className={`${AMOUNT} text-3xl`}>{formatRupiah(Math.abs(totals.remaining))}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="UDP diterima" value={formatRupiah(totals.udpReceived)} icon={Landmark} tone="bg-accent" />
        <StatTile label="Pengeluaran" value={formatRupiah(totals.totalExpense)} icon={Receipt} tone="bg-tile-pink" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Saldo dompet</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {data.wallets.map((wallet) => (
              <li key={wallet.id}>
                <Link href={`/lainnya/dompet/${wallet.id}`} className="flex min-h-11 items-center justify-between gap-2 py-2">
                  <span>{wallet.name}</span>
                  {wallet.kind === "reimburse" ? (
                    <span className="text-right font-medium">{reimburseStatus(wallet.balance)}</span>
                  ) : (
                    <span className={cn(AMOUNT, wallet.balance < 0 && "text-destructive")}>{formatRupiah(wallet.balance)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Transaksi terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length ? (
            <ul className="divide-y">
              {data.recent.map((view) => (
                <li key={view.id}>
                  <TransactionRow view={view} href={`/transaksi/${view.id}?dari=/`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Belum ada transaksi. Mulai dengan mencatat transfer UDP dari kantor.</p>
          )}
          <Link href="/transaksi" className={cn(buttonVariants({ variant: "outline" }), "mt-3 w-full")}>
            Lihat semua
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
