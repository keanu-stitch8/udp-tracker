import { sortCategoriesForPicker } from "@/modules/budgets/lib/category-order";
import type { Category } from "@/modules/budgets/types/category";
import type { CategoryGroup } from "@/modules/budgets/types/category-group";
import { sum } from "@/modules/shared/lib/money";
import { sumBy } from "@/modules/transactions/lib/ledger";
import type { ExpenseEntry } from "@/modules/transactions/types/transaction";

export interface CategoryShare {
  /** id kategori, atau "none" (tanpa kategori). */
  key: string;
  name: string;
  icon: string | null;
  amount: number;
  /** Persen dari total pengeluaran, dibulatkan. */
  share: number;
}

/** Pengeluaran per kategori (semua, tanpa digabung), terbesar dulu. Bukan terhadap pagu. */
export function categoryShares(entries: ExpenseEntry[], categories: Category[]): CategoryShare[] {
  const total = sum(entries.map((e) => e.amount));
  const byId = new Map(categories.map((c) => [c.id, c]));
  const share = (amount: number) => (total > 0 ? Math.round((amount / total) * 100) : 0);
  return [
    ...sumBy(
      entries,
      (e) => e.categoryId,
      (e) => e.amount,
    ),
  ]
    .map(([id, amount]) => {
      const category = id ? byId.get(id) : undefined;
      return { key: id ?? "none", name: category?.name ?? "Tanpa kategori", icon: category?.icon ?? null, amount, share: share(amount) };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface GroupShare {
  /** id grup, atau "none" (pengeluaran tanpa kategori). */
  key: string;
  name: string;
  amount: number;
  /** Persen dari total pengeluaran, dibulatkan. */
  share: number;
  /** Semua kategori grup ini yang ada pengeluarannya, terbesar dulu. */
  categories: CategoryShare[];
}

/** Pengeluaran per grup kategori (struktur RAB), grup A–Z ("Lain-lain" di akhir, "Tanpa kategori" paling bawah), dengan rincian kategori. */
export function groupShares(entries: ExpenseEntry[], categories: Category[], groups: CategoryGroup[]): GroupShare[] {
  const total = sum(entries.map((e) => e.amount));
  const groupOf = new Map(categories.map((c) => [c.id, c.groupId]));
  const names = new Map(groups.map((g) => [g.id, g.name]));
  const byGroup = new Map<string, CategoryShare[]>();
  for (const share of categoryShares(entries, categories)) {
    const key = groupOf.get(share.key) ?? "none";
    byGroup.set(key, [...(byGroup.get(key) ?? []), share]);
  }
  const shares = [...byGroup].map(([key, items]) => {
    const amount = sum(items.map((c) => c.amount));
    return { key, name: names.get(key) ?? "Tanpa kategori", amount, share: total > 0 ? Math.round((amount / total) * 100) : 0, categories: items };
  });
  return [...sortCategoriesForPicker(shares.filter((g) => g.key !== "none")), ...shares.filter((g) => g.key === "none")];
}

