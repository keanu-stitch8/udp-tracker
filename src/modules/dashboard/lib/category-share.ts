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
  /** Persen dari UDP diterima (bulat); null bila belum ada UDP. */
  share: number | null;
}

export interface GroupShare {
  /** id grup, atau "none" (pengeluaran tanpa kategori). */
  key: string;
  name: string;
  amount: number;
  /** Persen dari UDP diterima (bulat); null bila belum ada UDP. */
  share: number | null;
  /** Semua kategori grup ini yang ada pengeluarannya, terbesar dulu; persennya berjumlah persen grup. */
  categories: CategoryShare[];
}

/** Pemakaian UDP per grup (beranda). Bukan terhadap pagu: grup + sisa = 100% UDP diterima. */
export interface UdpBreakdown {
  received: number;
  used: number;
  remaining: number;
  /** Pengeluaran melebihi UDP diterima (perlu reimburse). */
  overBy: number;
  /** Σ persen grup; bisa > 100 bila lebih dari UDP. */
  usedShare: number | null;
  remainingShare: number | null;
  groups: GroupShare[];
}

/** Persen bulat dengan sisa terbesar: jumlahnya pas `target` (mis. 100), bukan 99 atau 101. */
export function roundShares(amounts: number[], base: number, target = Math.round((sum(amounts) / base) * 100)): number[] {
  const raw = amounts.map((a) => (a / base) * 100);
  const shares = raw.map(Math.floor);
  let left = target - sum(shares);
  const byRemainder = raw.map((r, i) => [r - shares[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of byRemainder) {
    if (left <= 0) break;
    shares[i]++;
    left--;
  }
  return shares;
}

/** Pengeluaran per kategori (semua, tanpa digabung), terbesar dulu. */
export function categoryAmounts(entries: ExpenseEntry[], categories: Category[]): Omit<CategoryShare, "share">[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return [
    ...sumBy(
      entries,
      (e) => e.categoryId,
      (e) => e.amount,
    ),
  ]
    .map(([id, amount]) => {
      const category = id ? byId.get(id) : undefined;
      return { key: id ?? "none", name: category?.name ?? "Tanpa kategori", icon: category?.icon ?? null, amount };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Pengeluaran per grup kategori (struktur RAB), grup A–Z ("Lain-lain" di akhir, "Tanpa kategori" paling bawah), persen dari UDP diterima. */
export function udpBreakdown(entries: ExpenseEntry[], categories: Category[], groups: CategoryGroup[], received: number): UdpBreakdown {
  const used = sum(entries.map((e) => e.amount));
  const remaining = Math.max(received - used, 0);
  const overBy = Math.max(used - received, 0);
  const groupOf = new Map(categories.map((c) => [c.id, c.groupId]));
  const names = new Map(groups.map((g) => [g.id, g.name]));
  const byGroup = new Map<string, Omit<CategoryShare, "share">[]>();
  for (const item of categoryAmounts(entries, categories)) {
    const key = groupOf.get(item.key) ?? "none";
    byGroup.set(key, [...(byGroup.get(key) ?? []), item]);
  }
  const unsorted = [...byGroup].map(([key, items]) => ({ key, name: names.get(key) ?? "Tanpa kategori", amount: sum(items.map((c) => c.amount)), categories: items }));
  const sorted = [...sortCategoriesForPicker(unsorted.filter((g) => g.key !== "none")), ...unsorted.filter((g) => g.key === "none")];

  if (received <= 0) {
    const groupsOut = sorted.map((g) => ({ ...g, share: null, categories: g.categories.map((c) => ({ ...c, share: null })) }));
    return { received, used, remaining, overBy, usedShare: null, remainingShare: null, groups: groupsOut };
  }
  const shares = roundShares([...sorted.map((g) => g.amount), remaining], received);
  const groupsOut = sorted.map((g, i) => {
    const categoryShares = roundShares(
      g.categories.map((c) => c.amount),
      received,
      shares[i],
    );
    return { ...g, share: shares[i], categories: g.categories.map((c, j) => ({ ...c, share: categoryShares[j] })) };
  });
  return { received, used, remaining, overBy, usedShare: sum(shares.slice(0, -1)), remainingShare: shares[shares.length - 1], groups: groupsOut };
}

/** Segmen busur gauge per grup, dalam persen panjang busur; lebih dari UDP → diskalakan ke total pengeluaran agar busur penuh. */
export function gaugeSegments(udp: UdpBreakdown): { key: string; start: number; length: number }[] {
  const scale = Math.max(udp.received, udp.used);
  const lengths = udp.groups.map((g) => (scale > 0 ? (g.amount / scale) * 100 : 0));
  return udp.groups.map((g, i) => ({ key: g.key, start: sum(lengths.slice(0, i)), length: lengths[i] }));
}
