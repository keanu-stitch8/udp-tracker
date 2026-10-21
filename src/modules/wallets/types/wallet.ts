import type { WalletKind } from "@/modules/shared/types/enums";

export interface Wallet {
  id: string;
  kind: WalletKind;
  name: string;
  holder: string | null;
  vehicleId: string | null;
  openingBalance: number;
  archived: boolean;
}

export interface WalletBalance extends Wallet {
  balance: number;
}
