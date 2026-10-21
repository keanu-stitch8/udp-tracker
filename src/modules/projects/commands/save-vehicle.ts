import "server-only";
import type { Db } from "@/db/types";
import { ConflictError } from "@/lib/errors";
import { selectTransactionRowsIncludingDeleted } from "@/modules/transactions/api/transactions-repo";
import { deleteWalletRows, insertWallets, selectWallets, updateWalletRow } from "@/modules/wallets/api/wallets-repo";
import { deleteVehicleRow, insertVehicles, selectVehicles, updateVehicleRow } from "../api/vehicles-repo";
import { flazzWalletName, uniqueName, vehicleRemoval } from "../lib/vehicles";
import { toVehicle } from "../mappers/project";
import { assertProjectEditable, findProjectOrThrow } from "../services/projects";
import { findVehicleOrThrow, planVehicle } from "../services/vehicles";
import type { Vehicle } from "../types/project";

async function editableProject(db: Db, projectId: string) {
  assertProjectEditable(await findProjectOrThrow(db, projectId));
}

const nextSortOrder = (rows: { sortOrder: number }[]) => Math.max(-1, ...rows.map((r) => r.sortOrder)) + 1;

/** Mobil baru + dompet "Flazz {mobil}" (keputusan pengguna 2026-10-21). */
export async function createVehicle(db: Db, projectId: string, input: unknown): Promise<Vehicle> {
  await editableProject(db, projectId);
  const [vehicleRows, walletRows] = await Promise.all([selectVehicles(db, projectId), selectWallets(db, projectId)]);
  const values = planVehicle(input, { otherNames: vehicleRows.map((v) => v.name), adding: true });
  return db.transaction(async (tx) => {
    const [vehicle] = await insertVehicles(tx, [{ ...values, projectId, sortOrder: nextSortOrder(vehicleRows) }]);
    await insertWallets(tx, [
      {
        projectId,
        kind: "flazz",
        name: uniqueName(flazzWalletName(vehicle.name), walletRows.map((w) => w.name)),
        vehicleId: vehicle.id,
        sortOrder: nextSortOrder(walletRows),
      },
    ]);
    return toVehicle(vehicle);
  });
}

/** Ganti nama/plat. Dompet bernama "Flazz {nama lama}" milik mobil ini ikut diganti namanya. */
export async function updateVehicle(db: Db, projectId: string, id: string, input: unknown): Promise<Vehicle> {
  await editableProject(db, projectId);
  const existing = await findVehicleOrThrow(db, projectId, id);
  const [vehicleRows, walletRows] = await Promise.all([selectVehicles(db, projectId), selectWallets(db, projectId)]);
  const values = planVehicle(input, { otherNames: vehicleRows.filter((v) => v.id !== id).map((v) => v.name), adding: false });
  return db.transaction(async (tx) => {
    const row = await updateVehicleRow(tx, id, values);
    if (values.name !== existing.name) {
      for (const wallet of walletRows.filter((w) => w.vehicleId === id && w.name === flazzWalletName(existing.name))) {
        const taken = walletRows.filter((w) => w.id !== wallet.id).map((w) => w.name);
        await updateWalletRow(tx, wallet.id, { name: uniqueName(flazzWalletName(values.name), taken) });
      }
    }
    return toVehicle(row);
  });
}

export async function deleteVehicle(db: Db, projectId: string, id: string): Promise<void> {
  await editableProject(db, projectId);
  await findVehicleOrThrow(db, projectId, id);
  const [walletRows, transactionRows] = await Promise.all([selectWallets(db, projectId), selectTransactionRowsIncludingDeleted(db, projectId)]);
  const removal = vehicleRemoval(id, { wallets: walletRows, transactions: transactionRows });
  if (!removal.allowed) {
    throw new ConflictError("Mobil sudah dipakai di transaksi atau dompet Flazz-nya sudah berisi. Ganti nama saja, atau arsipkan dompetnya.");
  }
  await db.transaction(async (tx) => {
    await deleteWalletRows(tx, removal.walletIds);
    await deleteVehicleRow(tx, id);
  });
}
