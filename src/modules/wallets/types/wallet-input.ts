// Skema input dompet — dipakai service (validasi) dan form (tipe).
import { z } from "zod";
import { WALLET_KINDS } from "@/modules/shared/types/enums";

export const walletInputSchema = z.object({
  kind: z.enum(WALLET_KINDS, "Pilih jenis dompet."),
  name: z.string().trim().min(1, "Nama dompet wajib diisi.").max(50, "Maksimal 50 karakter."),
  holder: z
    .string()
    .trim()
    .max(50, "Maksimal 50 karakter.")
    .nullish()
    .transform((value) => value || null),
  vehicleId: z
    .uuid("Pilihan tidak valid.")
    .nullish()
    .transform((value) => value ?? null),
  openingBalance: z
    .number({ error: "Saldo awal harus angka." })
    .int("Saldo awal harus bilangan bulat.")
    .min(0, "Saldo awal tidak boleh negatif.")
    .max(1_000_000_000, "Saldo awal terlalu besar.")
    .default(0),
  archived: z.boolean().default(false),
});

export type WalletInput = z.input<typeof walletInputSchema>;
