"use client";

import { ListPlus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppSelect } from "@/components/app/app-select";
import { LABEL } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/modules/shared/lib/date";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useTransactionList } from "../hooks/use-transactions";
import { EMPTY_FILTERS, filterTransactions, groupByDate, type TransactionFilters } from "../lib/filter";
import type { TransactionReference } from "../queries/views";
import { TransactionRow } from "./transaction-row";

const TYPES: { value: TransactionFilters["type"]; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
];

// Opsi "Semua …" bernilai "" = tanpa filter.
const withAll = (label: string, options: { id: string; name: string }[]) => [{ value: "", label }, ...options.map((o) => ({ value: o.id, label: o.name }))];

export function TransactionList({ reference }: { reference: TransactionReference }) {
  const { data: views = [] } = useTransactionList(reference.project.id);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<TransactionFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const adminCategoryId = reference.categories.find((c) => c.isAdminFee)?.id ?? null;
  const groups = groupByDate(filterTransactions(views, filters, adminCategoryId));

  if (!views.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <ListPlus className="size-8" />
          </EmptyMedia>
          <EmptyTitle>Belum ada transaksi</EmptyTitle>
          <EmptyDescription>Catat transfer UDP dari kantor atau pengeluaran pertama.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/transaksi/baru?dari=/transaksi" className={buttonVariants()}>
            + Catat transaksi
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Tabs value={filters.type} onValueChange={(type) => set({ type: type as TransactionFilters["type"] })}>
          <TabsList aria-label="Jenis" className="w-full">
            {TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-0">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-2">
          <AppSelect label="Kategori" value={filters.categoryId} items={withAll("Semua kategori", reference.categories)} onChange={(categoryId) => set({ categoryId })} />
          <AppSelect label="Dompet" value={filters.walletId} items={withAll("Semua dompet", reference.wallets)} onChange={(walletId) => set({ walletId })} />
          {reference.vehicles.length > 0 && (
            <AppSelect label="Mobil" value={filters.vehicleId} items={withAll("Semua mobil", reference.vehicles)} onChange={(vehicleId) => set({ vehicleId })} />
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Cari" placeholder="Cari…" className="h-10 pl-8" value={filters.q} onChange={(e) => set({ q: e.target.value })} />
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada transaksi yang cocok dengan filter.</p>
      ) : (
        groups.map((group) => (
          <section key={group.date} aria-label={formatDateShort(group.date)}>
            <div className="flex items-baseline justify-between border-b-2 pb-1">
              <h2 className={LABEL}>{formatDateShort(group.date)}</h2>
              {group.expenseTotal > 0 && <span className="text-xs text-muted-foreground tabular-nums">Keluar {formatRupiah(group.expenseTotal)}</span>}
            </div>
            <ul className="divide-y">
              {group.items.map((view) => (
                <li key={view.id}>
                  <TransactionRow view={view} href={`/transaksi/${view.id}?dari=/transaksi`} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
