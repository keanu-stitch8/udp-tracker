"use client";

import { ListPlus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NATIVE_SELECT_CLASS } from "@/components/app/form-classes";
import { LABEL } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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

export function TransactionList({ reference }: { reference: TransactionReference }) {
  const { data: views = [] } = useTransactionList(reference.project.id);
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const set = (patch: Partial<TransactionFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const groups = groupByDate(filterTransactions(views, filters));

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
          <NativeSelect aria-label="Kategori" className={NATIVE_SELECT_CLASS} value={filters.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
            <NativeSelectOption value="">Semua kategori</NativeSelectOption>
            {reference.categories.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Dompet" className={NATIVE_SELECT_CLASS} value={filters.walletId} onChange={(e) => set({ walletId: e.target.value })}>
            <NativeSelectOption value="">Semua dompet</NativeSelectOption>
            {reference.wallets.map((w) => (
              <NativeSelectOption key={w.id} value={w.id}>
                {w.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {reference.vehicles.length > 0 && (
            <NativeSelect aria-label="Mobil" className={NATIVE_SELECT_CLASS} value={filters.vehicleId} onChange={(e) => set({ vehicleId: e.target.value })}>
              <NativeSelectOption value="">Semua mobil</NativeSelectOption>
              {reference.vehicles.map((v) => (
                <NativeSelectOption key={v.id} value={v.id}>
                  {v.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
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
