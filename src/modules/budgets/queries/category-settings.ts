import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { sumBy } from "@/modules/transactions/lib/ledger";
import { getLedger } from "@/modules/transactions/queries/ledger";
import type { Category } from "../types/category";

export interface CategorySetting extends Category {
  /** Jumlah transaksi aktif berkategori ini. */
  usedCount: number;
  /** Pagu yang menghitung kategori ini. */
  budgetNames: string[];
}

export interface CategorySettings {
  projectId: string;
  locked: boolean;
  /** Semua kategori termasuk yang diarsipkan, urut sortOrder. */
  categories: CategorySetting[];
}

export const getCategorySettings = cache(async (db: Db, projectId: string): Promise<CategorySettings> => {
  const ledger = await getLedger(db, projectId);
  const used = sumBy(
    ledger.transactions.filter((t) => t.categoryId),
    (t) => t.categoryId!,
    () => 1,
  );
  return {
    projectId,
    locked: ledger.project.status === "done",
    categories: ledger.categories.map((c) => ({
      ...c,
      usedCount: used.get(c.id) ?? 0,
      budgetNames: ledger.budgets.filter((b) => b.categoryIds.includes(c.id)).map((b) => b.name),
    })),
  };
});
