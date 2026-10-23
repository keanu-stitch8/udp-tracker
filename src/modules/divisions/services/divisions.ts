import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { selectDivision, type DivisionRow } from "../api/divisions-repo";
import { divisionInputSchema } from "../types/division-input";

/** Nama divisi unik (tanpa beda huruf besar). */
export function planDivision(input: unknown, otherNames: string[]): { name: string } {
  const v = parseOrThrow(divisionInputSchema, input);
  if (otherNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) throw new ValidationError({ name: ["Nama divisi sudah dipakai."] });
  return v;
}

/** Divisi dari id (uuid tidak valid diperlakukan sebagai tidak ditemukan, bukan error DB). */
export async function findDivisionOrThrow(db: Db, id: string): Promise<DivisionRow> {
  const row = z.uuid().safeParse(id).success ? await selectDivision(db, id) : undefined;
  if (!row) throw new NotFoundError("Divisi tidak ditemukan.");
  return row;
}
