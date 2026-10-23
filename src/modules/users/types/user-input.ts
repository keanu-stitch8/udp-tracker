// Skema input halaman Pengguna/Divisi — dipakai service (validasi) dan hook (tipe).
import { z } from "zod";

export const rootInputSchema = z.object({ isRoot: z.boolean({ error: "Pilih Root atau bukan." }) });
export type RootInput = z.input<typeof rootInputSchema>;

export const divisionPmsInputSchema = z.object({ userIds: z.array(z.uuid("Pengguna tidak valid.")) });
export type DivisionPmsInput = z.input<typeof divisionPmsInputSchema>;
