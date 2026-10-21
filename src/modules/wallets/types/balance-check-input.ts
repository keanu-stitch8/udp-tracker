import { z } from "zod";
import { isoDateSchema } from "@/modules/shared/lib/date";

export const balanceCheckInputSchema = z.object({
  date: isoDateSchema,
  actualBalance: z
    .number({ error: "Saldo asli wajib diisi." })
    .int("Saldo harus bilangan bulat.")
    .min(0, "Saldo tidak boleh negatif.")
    .max(1_000_000_000, "Saldo terlalu besar."),
  note: z
    .string()
    .trim()
    .max(200, "Maksimal 200 karakter.")
    .nullish()
    .transform((value) => value || null),
});

export type BalanceCheckInput = z.input<typeof balanceCheckInputSchema>;

/** Kategori untuk transaksi penyesuaian; kosong = kategori bawaan. */
export const adjustInputSchema = z.object({
  categoryId: z
    .uuid("Pilih kategori.")
    .nullish()
    .transform((value) => value ?? null),
});

export type AdjustInput = z.input<typeof adjustInputSchema>;
