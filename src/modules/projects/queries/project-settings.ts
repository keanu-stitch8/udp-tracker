import "server-only";
import { cache } from "react";
import type { Db } from "@/db/types";
import { selectTransactionRowsIncludingDeleted } from "@/modules/transactions/api/transactions-repo";
import { selectWallets } from "@/modules/wallets/api/wallets-repo";
import { vehicleRemoval } from "../lib/vehicles";
import type { ProjectDetail, Vehicle } from "../types/project";
import { getProjectDetail } from "./projects";

export interface VehicleSetting extends Vehicle {
  removable: boolean;
  walletNames: string[];
}

export interface ProjectSettings {
  project: ProjectDetail;
  vehicles: VehicleSetting[];
}

export const getProjectSettings = cache(async (db: Db, projectId: string): Promise<ProjectSettings> => {
  const project = await getProjectDetail(db, projectId);
  const [walletRows, transactionRows] = await Promise.all([selectWallets(db, projectId), selectTransactionRowsIncludingDeleted(db, projectId)]);
  return {
    project,
    vehicles: project.vehicles.map((vehicle) => ({
      ...vehicle,
      removable: vehicleRemoval(vehicle.id, { wallets: walletRows, transactions: transactionRows }).allowed,
      walletNames: walletRows.filter((w) => w.vehicleId === vehicle.id).map((w) => w.name),
    })),
  };
});
