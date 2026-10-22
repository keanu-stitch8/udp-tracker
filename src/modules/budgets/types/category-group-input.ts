// Skema input grup kategori — dipakai service (validasi) dan form (tipe).
import { z } from "zod";

export const categoryGroupInputSchema = z.object({
  name: z.string().trim().min(1, "Nama grup wajib diisi.").max(40, "Maksimal 40 karakter."),
});

export type CategoryGroupInput = z.input<typeof categoryGroupInputSchema>;
