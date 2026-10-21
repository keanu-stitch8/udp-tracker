import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { selectBalanceCheck, type BalanceCheckRow } from "../api/balance-checks-repo";

export async function findBalanceCheckOrThrow(db: Db, projectId: string, id: string): Promise<BalanceCheckRow> {
  const row = z.uuid().safeParse(id).success ? await selectBalanceCheck(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Cek saldo tidak ditemukan.");
  return row;
}
