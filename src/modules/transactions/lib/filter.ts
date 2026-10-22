import type { TransactionType } from "@/modules/shared/types/enums";
import type { TransactionView } from "../types/transaction";
import { isAdminFeeTransaction } from "./ledger";
import { isMissingReceipt } from "./receipt";

/** "" = semua. `receipt: "missing"` = hanya pengeluaran tanpa bon (dibuka dari beranda lewat ?bon=belum). */
export interface TransactionFilters {
  type: TransactionType | "all";
  categoryId: string;
  walletId: string;
  vehicleId: string;
  q: string;
  receipt: "all" | "missing";
}

export const EMPTY_FILTERS: TransactionFilters = { type: "all", categoryId: "", walletId: "", vehicleId: "", q: "", receipt: "all" };

/** `adminCategoryId`: filter kategori Biaya Admin mencakup biaya admin pengeluaran/transfer. */
export function filterTransactions(views: TransactionView[], filters: TransactionFilters, adminCategoryId: string | null = null): TransactionView[] {
  const q = filters.q.trim().toLowerCase();
  const matchesCategory = (v: TransactionView) =>
    filters.categoryId === adminCategoryId ? isAdminFeeTransaction(v, adminCategoryId) : v.categoryId === filters.categoryId;
  return views.filter(
    (v) =>
      (filters.type === "all" || v.type === filters.type) &&
      (!filters.categoryId || matchesCategory(v)) &&
      (!filters.walletId || v.walletId === filters.walletId || v.toWalletId === filters.walletId) &&
      (!filters.vehicleId || v.vehicleId === filters.vehicleId) &&
      (filters.receipt === "all" || isMissingReceipt(v, adminCategoryId)) &&
      (!q || [v.merchant, v.note, v.categoryName].some((text) => text?.toLowerCase().includes(q))),
  );
}

export interface DayGroup {
  date: string;
  items: TransactionView[];
  expenseTotal: number;
}

/** `views` sudah urut terbaru dulu (toTransactionViews). Subtotal = pengeluaran + biaya admin (pengeluaran & transfer). */
export function groupByDate(views: TransactionView[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const view of views) {
    let group = groups.at(-1);
    if (!group || group.date !== view.date) {
      group = { date: view.date, items: [], expenseTotal: 0 };
      groups.push(group);
    }
    group.items.push(view);
    group.expenseTotal += (view.type === "expense" ? view.amount : 0) + (view.type === "income" ? 0 : view.adminFee);
  }
  return groups;
}
