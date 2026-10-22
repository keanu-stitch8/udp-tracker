import "server-only";
import { ValidationError, type FieldErrors } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import type { Category } from "@/modules/budgets/types/category";
import type { Vehicle } from "@/modules/projects/types/project";
import type { TransactionType } from "@/modules/shared/types/enums";
import type { Wallet } from "@/modules/wallets/types/wallet";
import { transactionInputSchema } from "../types/transaction-input";

export interface TransactionRefs {
  wallets: Wallet[];
  categories: Category[];
  vehicles: Vehicle[];
}

export interface TransactionValues {
  type: TransactionType;
  date: string;
  time: string;
  amount: number;
  categoryId: string | null;
  walletId: string;
  toWalletId: string | null;
  adminFee: number;
  vehicleId: string | null;
  merchant: string | null;
  note: string | null;
}

/**
 * Validasi input + aturan bisnis spec §3.4 terhadap referensi proyek; hasil siap disimpan.
 * `existing` = transaksi yang sedang diubah: pengeluaran lama berkategori Biaya Admin tetap boleh disimpan.
 */
export function planTransaction(input: unknown, refs: TransactionRefs, existing?: { categoryId: string | null }): TransactionValues {
  const { attachments, ...v } = parseOrThrow(transactionInputSchema, input);
  void attachments; // diproses terpisah oleh planAttachments, bukan kolom transaksi
  const errors: FieldErrors = {};
  if (!refs.wallets.some((w) => w.id === v.walletId)) errors.walletId = ["Dompet tidak ditemukan di proyek ini."];

  if (v.type === "transfer") {
    if (!refs.wallets.some((w) => w.id === v.toWalletId)) errors.toWalletId = ["Dompet tujuan tidak ditemukan di proyek ini."];
    if (Object.keys(errors).length) throw new ValidationError(errors);
    return { ...v, categoryId: null, vehicleId: null };
  }

  const category = refs.categories.find((c) => c.id === v.categoryId);
  if (!category) errors.categoryId = ["Kategori tidak ditemukan di proyek ini."];
  else if (category.kind !== v.type) errors.categoryId = ["Kategori tidak cocok dengan jenis transaksi."];
  else if (category.isAdminFee && existing?.categoryId !== category.id) errors.categoryId = ["Isi di kolom Biaya admin pada transaksi yang terkena biaya."];
  if (v.type === "income" && v.adminFee > 0) errors.adminFee = ["Pemasukan tidak punya biaya admin."];
  if (v.vehicleId) {
    if (category && !category.isVehicleRelated) errors.vehicleId = ["Kategori ini tidak terkait mobil."];
    else if (!refs.vehicles.some((vehicle) => vehicle.id === v.vehicleId)) errors.vehicleId = ["Mobil tidak ditemukan di proyek ini."];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { ...v, toWalletId: null };
}
