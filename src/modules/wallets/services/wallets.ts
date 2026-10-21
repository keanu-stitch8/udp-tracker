import "server-only";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError, type FieldErrors } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import type { Vehicle } from "@/modules/projects/types/project";
import type { WalletKind } from "@/modules/shared/types/enums";
import { selectWallet, type WalletRow } from "../api/wallets-repo";
import { walletInputSchema } from "../types/wallet-input";

export interface WalletValues {
  kind: WalletKind;
  name: string;
  holder: string | null;
  vehicleId: string | null;
  openingBalance: number;
  archived: boolean;
}

/** Validasi dompet: nama unik di proyek; mobil hanya untuk Flazz dan harus milik proyek. */
export function planWallet(input: unknown, refs: { vehicles: Vehicle[]; otherWalletNames: string[] }): WalletValues {
  const v = parseOrThrow(walletInputSchema, input);
  const errors: FieldErrors = {};
  if (refs.otherWalletNames.some((n) => n.toLowerCase() === v.name.toLowerCase())) errors.name = ["Nama dompet sudah dipakai."];
  if (v.vehicleId) {
    if (v.kind !== "flazz") errors.vehicleId = ["Hanya dompet Flazz yang terkait mobil."];
    else if (!refs.vehicles.some((vehicle) => vehicle.id === v.vehicleId)) errors.vehicleId = ["Mobil tidak ditemukan di proyek ini."];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return v;
}

export async function findWalletOrThrow(db: Db, projectId: string, id: string): Promise<WalletRow> {
  const row = z.uuid().safeParse(id).success ? await selectWallet(db, projectId, id) : undefined;
  if (!row) throw new NotFoundError("Dompet tidak ditemukan.");
  return row;
}
