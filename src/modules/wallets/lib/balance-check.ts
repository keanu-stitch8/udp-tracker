// Cek saldo (spec §3.3): selisih = saldo asli − saldo aplikasi; "Catat selisih" membuat transaksi penyesuaian.
import type { Category } from "@/modules/budgets/types/category";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { TransactionInput } from "@/modules/transactions/types/transaction-input";
import type { Wallet } from "../types/wallet";

export const ADJUSTMENT_NOTE = "Penyesuaian cek saldo";

/** Kategori bawaan untuk selisih: kurang → pengeluaran (Tol untuk Flazz, selain itu Lain-lain), lebih → pemasukan bukan UDP kantor. */
export function defaultAdjustmentCategoryId(difference: number, wallet: Pick<Wallet, "kind">, categories: Category[]): string | null {
  const active = categories.filter((c) => !c.archived);
  if (difference > 0) {
    const income = active.filter((c) => c.kind === "income" && !c.isOfficeFunding);
    return (income.find((c) => c.name === "Lainnya") ?? income[0])?.id ?? null;
  }
  const expense = active.filter((c) => c.kind === "expense" && !c.isAdminFee);
  const preferred = wallet.kind === "flazz" ? "Tol" : "Lain-lain";
  return (expense.find((c) => c.name === preferred) ?? expense.find((c) => c.name === "Lain-lain") ?? expense[0])?.id ?? null;
}

export function adjustmentInput(
  check: { date: string; difference: number },
  wallet: Pick<Wallet, "id" | "vehicleId">,
  category: Pick<Category, "id" | "isVehicleRelated">,
): TransactionInput {
  return {
    type: check.difference < 0 ? "expense" : "income",
    date: check.date,
    // Penyesuaian mewakili saldo di akhir hari cek saldo.
    time: "23:59",
    amount: Math.abs(check.difference),
    categoryId: category.id,
    walletId: wallet.id,
    vehicleId: category.isVehicleRelated ? wallet.vehicleId : null,
    note: ADJUSTMENT_NOTE,
  };
}

export function describeDifference(difference: number): string {
  if (difference === 0) return "Cocok";
  return `${difference < 0 ? "Kurang" : "Lebih"} ${formatRupiah(Math.abs(difference))}`;
}
