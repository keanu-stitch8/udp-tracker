import "server-only";
import type { Db } from "@/db/types";
import { ConflictError } from "@/lib/errors";
import { countProjectsByDivision, deleteDivisionRow, insertDivision, selectDivisions, updateDivisionRow } from "../api/divisions-repo";
import { toDivision } from "../mappers/division";
import { findDivisionOrThrow, planDivision } from "../services/divisions";
import type { Division } from "../types/division";

async function otherNames(db: Db, exceptId?: string) {
  return (await selectDivisions(db)).filter((d) => d.id !== exceptId).map((d) => d.name);
}

export async function createDivision(db: Db, input: unknown): Promise<Division> {
  const values = planDivision(input, await otherNames(db));
  return toDivision(await insertDivision(db, values), 0);
}

export async function renameDivision(db: Db, id: string, input: unknown): Promise<Division> {
  await findDivisionOrThrow(db, id);
  const values = planDivision(input, await otherNames(db, id));
  const row = await updateDivisionRow(db, id, values);
  return toDivision(row, (await countProjectsByDivision(db)).get(id) ?? 0);
}

/** Hapus divisi kosong. Divisi berisi proyek ditolak: proyeknya dipindah dulu lewat pengaturan proyek. */
export async function deleteDivision(db: Db, id: string): Promise<void> {
  await findDivisionOrThrow(db, id);
  const projectCount = (await countProjectsByDivision(db)).get(id) ?? 0;
  if (projectCount) throw new ConflictError(`Divisi masih berisi ${projectCount} proyek. Pindahkan proyeknya dulu.`);
  await deleteDivisionRow(db, id);
}
