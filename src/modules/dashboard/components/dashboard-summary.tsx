"use client";

import Link from "next/link";
import { BudgetBar } from "@/components/app/budget-bar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { TransactionRow } from "@/modules/transactions/components/transaction-row";
import { useDashboardSummary } from "../hooks/use-summary";

export function DashboardSummaryView({ projectId }: { projectId: string }) {
  const { data } = useDashboardSummary(projectId);
  if (!data) return null;
  const { totals } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="UDP diterima" value={totals.udpReceived} />
        <Stat label="Pengeluaran" value={totals.totalExpense} />
        <Card className="col-span-2 bg-primary">
          <CardContent className="py-3">
            <p className="text-xs">{totals.remaining >= 0 ? "Sisa (dikembalikan ke kantor)" : "Kurang (perlu reimburse)"}</p>
            <p className="font-head text-3xl tabular-nums">{formatRupiah(Math.abs(totals.remaining))}</p>
          </CardContent>
        </Card>
      </div>

      {data.budgets.map((budget) => (
        <Card key={budget.budgetId}>
          <CardHeader>
            <CardTitle className="text-base">{budget.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <BudgetBar used={budget.used} limit={budget.limit} />
            <p className="tabular-nums">
              {formatRupiah(budget.used)} dari {formatRupiah(budget.limit)}
            </p>
            {budget.overBy > 0 ? (
              <p className="font-medium text-destructive">Ditanggung kantor: {formatRupiah(budget.overBy)}</p>
            ) : (
              <p className="text-muted-foreground">Sisa pagu {formatRupiah(budget.remaining)}</p>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo dompet</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {data.wallets.map((wallet) => (
              <li key={wallet.id}>
                <Link href={`/lainnya/dompet/${wallet.id}`} className="flex min-h-11 items-center justify-between gap-2 py-2">
                  <span>{wallet.name}</span>
                  <span className={cn("font-head tabular-nums", wallet.balance < 0 && "text-destructive")}>{formatRupiah(wallet.balance)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi terakhir</CardTitle>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-head text-lg tabular-nums">{formatRupiah(value)}</p>
      </CardContent>
    </Card>
  );
}
