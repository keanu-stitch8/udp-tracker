// Skema input pemegang dompet — dipakai command (validasi) dan hook (tipe).
import { z } from "zod";

export const walletHoldersInputSchema = z.object({ userIds: z.array(z.uuid("Pengguna tidak valid.")).max(20, "Maksimal 20 pemegang.") });
export type WalletHoldersInput = z.input<typeof walletHoldersInputSchema>;
