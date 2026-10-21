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
  amount: number;
  categoryId: string | null;
  walletId: string;
  toWalletId: string | null;
  adminFee: number;
  vehicleId: string | null;
  merchant: string | null;
  note: string | null;
}

/** Validasi input + aturan bisnis spec §3.4 terhadap referensi proyek; hasil siap disimpan. */
export function planTransaction(input: unknown, refs: TransactionRefs): TransactionValues {
  // Lampiran diproses terpisah (planAttachments), bukan kolom transaksi.
  const { attachments: _attachments, ...v } = parseOrThrow(transactionInputSchema, input);
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
  if (v.vehicleId) {
    if (category && !category.isVehicleRelated) errors.vehicleId = ["Kategori ini tidak terkait mobil."];
    else if (!refs.vehicles.some((vehicle) => vehicle.id === v.vehicleId)) errors.vehicleId = ["Mobil tidak ditemukan di proyek ini."];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { ...v, toWalletId: null, adminFee: 0 };
}
