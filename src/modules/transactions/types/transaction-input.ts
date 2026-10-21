// Skema input transaksi — dipakai service (validasi) dan form (tipe).
import { z } from "zod";
import { attachmentsInputSchema } from "@/modules/receipts/types/attachment";
import { isoDateSchema } from "@/modules/shared/lib/date";
import { TRANSACTION_TYPES } from "@/modules/shared/types/enums";

const optionalId = z
  .uuid("Pilihan tidak valid.")
  .nullish()
  .transform((value) => value ?? null);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .nullish()
    .transform((value) => value || null);

export const transactionInputSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, "Pilih jenis transaksi."),
    date: isoDateSchema,
    amount: z
      .number({ error: "Nominal wajib diisi." })
      .int("Nominal harus bilangan bulat.")
      .min(1, "Nominal harus lebih dari 0.")
      .max(1_000_000_000, "Nominal terlalu besar."),
    categoryId: optionalId,
    walletId: z.uuid("Pilih dompet."),
    toWalletId: optionalId,
    adminFee: z
      .number({ error: "Biaya admin harus angka." })
      .int("Biaya admin harus bilangan bulat.")
      .min(0, "Biaya admin tidak boleh negatif.")
      .max(1_000_000, "Biaya admin terlalu besar.")
      .default(0),
    vehicleId: optionalId,
    merchant: optionalText(100),
    note: optionalText(500),
    /** Tidak dikirim = lampiran tidak diubah (dipakai saat ubah transaksi). */
    attachments: attachmentsInputSchema,
  })
  .superRefine((v, ctx) => {
    if (v.type === "transfer") {
      if (!v.toWalletId) ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Pilih dompet tujuan." });
      else if (v.toWalletId === v.walletId) ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Dompet tujuan harus berbeda dari dompet asal." });
    } else if (!v.categoryId) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Pilih kategori." });
    }
  });

export type TransactionInput = z.input<typeof transactionInputSchema>;
