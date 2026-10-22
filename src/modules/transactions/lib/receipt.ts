import type { TransactionView } from "../types/transaction";

/** Pengeluaran yang seharusnya punya bon tapi belum ada lampiran. Penyesuaian cek saldo & Biaya Admin lama memang tanpa bon. */
export function isMissingReceipt(view: TransactionView, adminCategoryId: string | null): boolean {
  return view.type === "expense" && !view.balanceCheckId && view.categoryId !== adminCategoryId && view.attachments.length === 0;
}
