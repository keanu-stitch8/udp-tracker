// Skema input kategori — dipakai service (validasi) dan form (tipe).
import { z } from "zod";
import { CATEGORY_ICONS } from "@/modules/shared/types/category-icons";
import { CATEGORY_KINDS } from "@/modules/shared/types/enums";

export const categoryInputSchema = z.object({
  kind: z.enum(CATEGORY_KINDS, "Pilih jenis kategori."),
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(40, "Maksimal 40 karakter."),
  icon: z.enum(CATEGORY_ICONS, "Pilih ikon."),
  isVehicleRelated: z.boolean().default(false),
  archived: z.boolean().default(false),
});

export type CategoryInput = z.input<typeof categoryInputSchema>;
