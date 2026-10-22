import type { WalletKind } from "@/modules/shared/types/enums";

export const WALLET_KIND_LABELS: Record<WalletKind, string> = {
  bank: "Rekening",
  cash: "Cash",
  flazz: "Flazz",
  ewallet: "E-wallet",
  reimburse: "Reimburse",
};
