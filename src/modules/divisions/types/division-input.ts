// Skema input divisi — dipakai service (validasi) dan form (tipe).
import { z } from "zod";

export const divisionInputSchema = z.object({
  name: z.string().trim().min(1, "Nama divisi wajib diisi.").max(50, "Maksimal 50 karakter."),
});

export type DivisionInput = z.input<typeof divisionInputSchema>;
