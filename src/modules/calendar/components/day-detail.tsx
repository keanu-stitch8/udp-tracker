"use client";

import Link from "next/link";
import { BudgetBar } from "@/components/app/budget-bar";
import { CategoryIcon } from "@/components/app/category-icon";
import { AMOUNT } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { TransactionRow } from "@/modules/transactions/components/transaction-row";
import { useDayDetail } from "../hooks/use-calendar";

/** `onNavigate`: tutup drawer saat membuka link — Next 16 menyimpan state halaman, drawer yang tertinggal terbuka menahan klik toast. */
export function DayDetailPanel({ projectId, date, onNavigate }: { projectId: string; date: string; onNavigate?: () => void }) {
  const { data, isPending, error } = useDayDetail(projectId, date);
  const addHref = `/transaksi/baru?tanggal=${date}&dari=/kalender`;

  if (isPending) return <Skeleton className="m-4 h-40" />;
  if (error || !data) return <p className="p-4 text-sm text-destructive">{error?.message ?? "Gagal memuat."}</p>;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4" onClickCapture={(event) => (event.target as HTMLElement).closest("a") && onNavigate?.()}>
      <p className={`${AMOUNT} text-2xl`}>{formatRupiah(data.expenseTotal)}</p>

      {data.budgets.map((budget) => (
        <div key={budget.budgetId} className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span>{budget.name} hari ini</span>
            <span className="tabular-nums">
              {formatRupiah(budget.used)} / {formatRupiah(budget.limit)}
            </span>
          </div>
          <BudgetBar used={budget.used} limit={budget.limit} />
          {budget.used > budget.limit && <p className="text-destructive">Lebih pagu {formatRupiah(budget.used - budget.limit)}</p>}
        </div>
      ))}

      {data.byCategory.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {data.byCategory.map((row) => (
            <li key={row.categoryId ?? "admin"} className="flex items-center gap-2">
              <CategoryIcon name={row.icon} className="size-4" />
              <span className="flex-1">{row.name}</span>
              <span className="tabular-nums">{formatRupiah(row.total)}</span>
            </li>
          ))}
        </ul>
      )}

      {data.transactions.length ? (
        <ul className="divide-y border-t-2">
          {data.transactions.map((view) => (
            <li key={view.id}>
              <TransactionRow view={view} href={`/transaksi/${view.id}?dari=/kalender`} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada transaksi di tanggal ini.</p>
      )}

      <Link href={addHref} className={cn(buttonVariants(), "w-full")}>
        + Catat di tanggal ini
      </Link>
    </div>
  );
}
