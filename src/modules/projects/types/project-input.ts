// Skema input proyek — dipakai service (validasi) dan form (tipe).
import { z } from "zod";
import { isoDateSchema } from "@/modules/shared/lib/date";
import { PROJECT_STATUSES } from "@/modules/shared/types/enums";

const divisionId = z.uuid("Pilih divisi.");
const name = z.string().trim().min(1, "Nama proyek wajib diisi.").max(100, "Maksimal 100 karakter.");
const location = z.string().trim().max(100, "Maksimal 100 karakter.");
const pax = z.number({ error: "Jumlah orang wajib diisi." }).int("Harus bilangan bulat.").min(1, "Minimal 1 orang.").max(100, "Maksimal 100 orang.");
const vehicleName = z.string().trim().min(1, "Nama mobil wajib diisi.").max(50, "Maksimal 50 karakter.");
const END_BEFORE_START = "Tanggal selesai harus sama atau setelah tanggal mulai.";

export const createProjectSchema = z
  .object({
    divisionId,
    name,
    location: location.default(""),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    pax,
    vehicles: z.array(vehicleName).max(5, "Maksimal 5 mobil.").default([]),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: END_BEFORE_START });

export type CreateProjectInput = z.input<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({ divisionId, name, location, startDate: isoDateSchema, endDate: isoDateSchema, pax, status: z.enum(PROJECT_STATUSES) })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada perubahan." });

export type UpdateProjectInput = z.input<typeof updateProjectSchema>;

export const PROJECT_END_BEFORE_START = END_BEFORE_START;
