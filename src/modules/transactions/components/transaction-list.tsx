"use client";

import { ListPlus, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppSelect } from "@/components/app/app-select";
import { LABEL } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupCategories } from "@/modules/budgets/lib/category-groups";
import { sortCategoriesForPicker } from "@/modules/budgets/lib/category-order";
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

/** Pengeluaran per grup (urutan tampil), lalu pemasukan di grup "Pemasukan". */
function categoryOptions(reference: TransactionReference) {
  return [
    { value: "", label: "Semua kategori" },
    ...groupCategories(reference.groups, reference.categories).flatMap(({ group, categories }) => categories.map((c) => ({ value: c.id, label: c.name, group: group.name }))),
    ...sortCategoriesForPicker(reference.categories.filter((c) => c.kind === "income")).map((c) => ({ value: c.id, label: c.name, group: "Pemasukan" })),
  ];
}

export function TransactionList({ reference }: { reference: TransactionReference }) {
  const { data: views = [] } = useTransactionList(reference.project.id);
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TransactionFilters>(() => ({ ...EMPTY_FILTERS, receipt: searchParams.get("bon") === "belum" ? "missing" : "all" }));
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
          <AppSelect label="Kategori" value={filters.categoryId} items={categoryOptions(reference)} onChange={(categoryId) => set({ categoryId })} />
          <AppSelect label="Dompet" value={filters.walletId} items={withAll("Semua dompet", reference.wallets)} onChange={(walletId) => set({ walletId })} />
          {reference.vehicles.length > 0 && (
            <AppSelect label="Mobil" value={filters.vehicleId} items={withAll("Semua mobil", reference.vehicles)} onChange={(vehicleId) => set({ vehicleId })} />
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Cari" placeholder="Cari…" className="h-10 pl-8" value={filters.q} onChange={(e) => set({ q: e.target.value })} />
          </div>
        </div>
        {filters.receipt === "missing" && (
          <button type="button" onClick={() => set({ receipt: "all" })} className="flex items-center gap-1 self-start border-2 bg-accent px-2 py-1 text-xs font-medium">
            Tanpa bon <X className="size-3.5" aria-label="Hapus filter" />
          </button>
        )}
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
