import type { ProjectStatus, WalletKind } from "@/modules/shared/types/enums";
import type { TransactionView } from "@/modules/transactions/types/transaction";
import type { WalletHolderRecord } from "@/modules/wallets/types/wallet-holder";

/** Dompet yang pernah dipegang seseorang di satu proyek, beserta periodenya dan posisi uangnya (spec profil riwayat). */
export interface HeldWalletSummary {
  walletId: string;
  name: string;
  kind: WalletKind;
  /** Periode pegangan orang ini, terbaru dulu. */
  periods: WalletHolderRecord[];
  openingBalance: number;
  /** Pemasukan + transfer masuk. */
  moneyIn: number;
  /** Pengeluaran + transfer keluar + biaya admin. */
  moneyOut: number;
  balance: number;
  /** Selisih cek saldo terakhir (asli − aplikasi), null bila belum pernah cek. */
  lastCheckDifference: number | null;
}

export interface InputSummary {
  count: number;
  income: number;
  /** Pengeluaran + biaya admin dari transaksi yang dia input. */
  expense: number;
}

export interface PersonProjectSummary {
  project: { id: string; name: string; startDate: string; endDate: string; status: ProjectStatus; divisionName: string };
  wallets: HeldWalletSummary[];
  input: InputSummary;
}

export interface ProfilePerson {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
}

export interface PersonHistory {
  person: ProfilePerson;
  isSelf: boolean;
  projects: PersonProjectSummary[];
}

export interface PersonProjectDetail {
  person: ProfilePerson;
  summary: PersonProjectSummary;
  /** Pengeluaran yang dia input per kategori, terbesar dulu. */
  categories: { categoryId: string | null; name: string; amount: number }[];
  /** Transaksi yang dia input, terbaru dulu. */
  transactions: TransactionView[];
}
