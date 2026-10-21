import { z } from "zod";
import { BUDGET_BASES } from "@/modules/shared/types/enums";

export const budgetInputSchema = z.object({
  name: z.string().trim().min(1, "Nama pagu wajib diisi.").max(60, "Maksimal 60 karakter."),
  rate: z.number({ error: "Tarif wajib diisi." }).int("Tarif harus bilangan bulat.").min(0, "Tarif tidak boleh negatif.").max(1_000_000_000, "Tarif terlalu besar."),
  basis: z.enum(BUDGET_BASES, "Pilih cara hitung."),
  categoryIds: z.array(z.uuid("Kategori tidak valid."), "Pilih minimal satu kategori.").min(1, "Pilih minimal satu kategori.").max(20),
  note: z
    .string()
    .trim()
    .max(200, "Maksimal 200 karakter.")
    .nullish()
    .transform((value) => value || null),
});

export type BudgetInput = z.input<typeof budgetInputSchema>;
