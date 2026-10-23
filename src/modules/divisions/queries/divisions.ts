import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { countProjectsByDivision, selectDivisions } from "../api/divisions-repo";
import { toDivision } from "../mappers/division";
import type { Division } from "../types/division";

/** Semua divisi A–Z, dengan jumlah proyeknya. */
export const listDivisions = cache(async (db: Db): Promise<Division[]> => {
  const [rows, counts] = await Promise.all([selectDivisions(db), countProjectsByDivision(db)]);
  return rows.map((row) => toDivision(row, counts.get(row.id) ?? 0)).sort((a, b) => a.name.localeCompare(b.name, "id"));
});
