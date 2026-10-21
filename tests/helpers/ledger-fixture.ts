import type { Budget } from "@/modules/budgets/types/budget";
import type { Category } from "@/modules/budgets/types/category";
import type { Transaction } from "@/modules/transactions/types/transaction";
import type { Wallet } from "@/modules/wallets/types/wallet";

const wallet = (id: string, kind: Wallet["kind"], openingBalance = 0, vehicleId: string | null = null): Wallet => ({
  id,
  kind,
  name: id,
  holder: null,
  vehicleId,
  openingBalance,
  archived: false,
});

const category = (id: string, kind: Category["kind"], flags: Partial<Category> = {}): Category => ({
  id,
  kind,
  name: id,
  icon: "ellipsis",
  isVehicleRelated: false,
  isAdminFee: false,
  isOfficeFunding: false,
  archived: false,
  ...flags,
});

let seq = 0;
/** Setiap panggilan mendapat createdAt yang naik → urutan "terbaru dulu" pada tanggal sama pasti. */
export const tx = (t: Partial<Transaction> & Pick<Transaction, "type" | "date" | "amount" | "walletId">): Transaction => {
  const n = ++seq;
  return {
    id: `t${n}`,
    categoryId: null,
    toWalletId: null,
    adminFee: 0,
    vehicleId: null,
    merchant: null,
    note: null,
    createdAt: `2026-10-21T00:00:${String(n).padStart(2, "0")}.000Z`,
    ...t,
  };
};

export const wallets: Wallet[] = [wallet("rekening", "bank"), wallet("cash", "cash"), wallet("flazz1", "flazz", 200_000, "mobil1")];

export const categories: Category[] = [
  category("makan-siang", "expense"),
  category("makan-malam", "expense"),
  category("tol", "expense", { isVehicleRelated: true }),
  category("admin", "expense", { isAdminFee: true }),
  category("udp", "income", { isOfficeFunding: true }),
  category("lainnya", "income"),
];

export const transactions: Transaction[] = [
  tx({ id: "udp1", type: "income", date: "2026-10-19", amount: 5_000_000, walletId: "rekening", categoryId: "udp" }),
  tx({ id: "refund", type: "income", date: "2026-10-19", amount: 100_000, walletId: "cash", categoryId: "lainnya" }),
  tx({ id: "tf1", type: "transfer", date: "2026-10-19", amount: 1_000_000, walletId: "rekening", toWalletId: "cash", adminFee: 6_500 }),
  tx({ id: "siang", type: "expense", date: "2026-10-20", amount: 600_000, walletId: "cash", categoryId: "makan-siang" }),
  tx({ id: "malam", type: "expense", date: "2026-10-20", amount: 900_000, walletId: "cash", categoryId: "makan-malam" }),
  tx({ id: "tol1", type: "expense", date: "2026-10-21", amount: 50_000, walletId: "flazz1", categoryId: "tol", vehicleId: "mobil1" }),
];

export const mealBudget: Budget = {
  id: "pagu-makan",
  name: "Pagu Makan",
  rate: 150_000,
  basis: "per_pax_per_day",
  days: null,
  note: null,
  categoryIds: ["makan-siang", "makan-malam"],
};
