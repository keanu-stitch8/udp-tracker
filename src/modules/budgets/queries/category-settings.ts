import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { categoryUseCounts } from "@/modules/transactions/lib/ledger";
import { getLedger } from "@/modules/transactions/queries/ledger";
import { sortCategoriesForPicker } from "../lib/category-order";
import type { Category } from "../types/category";
import type { CategoryGroup } from "../types/category-group";

export interface CategorySetting extends Category {
  /** Jumlah transaksi aktif berkategori ini. */
  usedCount: number;
  /** Pagu yang menghitung kategori ini. */
  budgetNames: string[];
}

export interface CategoryGroupSetting extends CategoryGroup {
  /** Jumlah kategori di grup, termasuk yang diarsipkan (grup hanya bisa dihapus bila 0). */
  categoryCount: number;
}

export interface CategorySettings {
  projectId: string;
  locked: boolean;
  /** Urutan tampil: A–Z, "Lain-lain" terakhir. */
  groups: CategoryGroupSetting[];
  /** Semua kategori termasuk yang diarsipkan, urut sortOrder. */
  categories: CategorySetting[];
}

export const getCategorySettings = cache(async (db: Db, projectId: string): Promise<CategorySettings> => {
  const ledger = await getLedger(db, projectId);
  const used = categoryUseCounts(ledger.transactions, ledger.categories);
  return {
    projectId,
    locked: ledger.project.status === "done",
    groups: sortCategoriesForPicker(ledger.groups).map((g) => ({ ...g, categoryCount: ledger.categories.filter((c) => c.groupId === g.id).length })),
    categories: ledger.categories.map((c) => ({
      ...c,
      usedCount: used.get(c.id) ?? 0,
      budgetNames: ledger.budgets.filter((b) => b.categoryIds.includes(c.id)).map((b) => b.name),
    })),
  };
});
