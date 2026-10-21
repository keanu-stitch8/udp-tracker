import { z } from "zod";

export const vehicleInputSchema = z.object({
  name: z.string().trim().min(1, "Nama mobil wajib diisi.").max(50, "Maksimal 50 karakter."),
  plate: z
    .string()
    .trim()
    .max(15, "Maksimal 15 karakter.")
    .nullish()
    .transform((value) => value || null),
});

export type VehicleInput = z.input<typeof vehicleInputSchema>;
