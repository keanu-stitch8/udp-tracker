import type { Attachment } from "@/modules/receipts/types/attachment";
import type { TransactionType } from "@/modules/shared/types/enums";

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  /** "HH:mm" 24 jam, WIB. */
  time: string;
  amount: number;
  categoryId: string | null;
  walletId: string;
  toWalletId: string | null;
  adminFee: number;
  vehicleId: string | null;
  merchant: string | null;
  note: string | null;
  /** Diisi jika transaksi ini penyesuaian dari cek saldo (spec §3.3). */
  balanceCheckId: string | null;
  createdAt: string;
}

/** Transaksi + nama-nama referensi untuk ditampilkan. */
export interface TransactionView extends Transaction {
  categoryName: string | null;
  categoryIcon: string | null;
  walletName: string;
  toWalletName: string | null;
  vehicleName: string | null;
  attachments: Attachment[];
}

/** Satu baris pengeluaran: nominal transaksi expense, atau biaya admin expense/transfer (kategori isAdminFee). */
export interface ExpenseEntry {
  transactionId: string;
  date: string;
  categoryId: string | null;
  walletId: string;
  amount: number;
}

export interface LedgerTotals {
  openingTotal: number;
  totalIncome: number;
  udpReceived: number;
  totalExpense: number;
  /** ≥ 0 → dikembalikan ke kantor; < 0 → kurang, perlu reimburse. */
  remaining: number;
}
