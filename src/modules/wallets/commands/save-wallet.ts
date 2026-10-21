import "server-only";
import type { Db } from "@/db/types";
import { selectVehicles } from "@/modules/projects/api/vehicles-repo";
import { toVehicle } from "@/modules/projects/mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { insertWallets, selectWallets, updateWalletRow } from "../api/wallets-repo";
import { toWallet } from "../mappers/wallet";
import { findWalletOrThrow, planWallet } from "../services/wallets";
import type { Wallet } from "../types/wallet";

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

async function refs(db: Db, projectId: string, exceptWalletId?: string) {
  const [walletRows, vehicleRows] = await Promise.all([selectWallets(db, projectId), selectVehicles(db, projectId)]);
  return {
    vehicles: vehicleRows.map(toVehicle),
    otherWalletNames: walletRows.filter((w) => w.id !== exceptWalletId).map((w) => w.name),
    nextSortOrder: Math.max(-1, ...walletRows.map((w) => w.sortOrder)) + 1,
  };
}

export async function createWallet(db: Db, projectId: string, input: unknown): Promise<Wallet> {
  await editableProject(db, projectId);
  const r = await refs(db, projectId);
  const values = planWallet(input, r);
  const [row] = await insertWallets(db, [{ ...values, projectId, sortOrder: r.nextSortOrder }]);
  return toWallet(row);
}

export async function updateWallet(db: Db, projectId: string, id: string, input: unknown): Promise<Wallet> {
  await editableProject(db, projectId);
  await findWalletOrThrow(db, projectId, id);
  const values = planWallet(input, await refs(db, projectId, id));
  return toWallet(await updateWalletRow(db, id, values));
}
