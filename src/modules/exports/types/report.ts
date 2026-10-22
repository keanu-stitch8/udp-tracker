import type { Budget } from "@/modules/budgets/types/budget";
import type { Category } from "@/modules/budgets/types/category";
import type { CategoryGroup } from "@/modules/budgets/types/category-group";
import type { ProjectDetail } from "@/modules/projects/types/project";
import type { Transaction } from "@/modules/transactions/types/transaction";
import type { Wallet } from "@/modules/wallets/types/wallet";

/** Satu sel laporan; gateway Google menerjemahkan `money` → format #,##0, `bold` → tebal, `link` → teks berlink. */
export interface ReportCell {
  value: string | number | null;
  bold?: boolean;
  money?: boolean;
  link?: string;
}

export interface ReportTab {
  title: string;
  rows: ReportCell[][];
  /** Baris header yang dibekukan (0 = tanpa). */
  freezeRows: number;
}

export interface ReportInput {
  project: ProjectDetail;
  wallets: Wallet[];
  categories: Category[];
  groups: CategoryGroup[];
  budgets: Budget[];
  transactions: Transaction[];
  /** Urutan = urutan lampiran per transaksi ("Bon 1", "Bon 2", …). */
  receipts: { transactionId: string; driveUrl: string | null }[];
  exportedAt: Date;
}
