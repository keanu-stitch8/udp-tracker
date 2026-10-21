import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { useLedgerMutation } from "@/modules/transactions/hooks/use-ledger-mutation";
import type { Transaction } from "@/modules/transactions/types/transaction";
import type { WalletDetail, WalletList } from "../queries/wallets";
import type { BalanceCheck } from "../types/balance-check";
import type { BalanceCheckInput } from "../types/balance-check-input";
import type { Wallet } from "../types/wallet";
import type { WalletInput } from "../types/wallet-input";

const base = (projectId: string) => `/api/projects/${projectId}`;

export function useWalletList(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.wallets(projectId), queryFn: () => apiFetch<WalletList>(`${base(projectId)}/wallets`) });
}

export function useWalletDetail(projectId: string, walletId: string) {
  return useQuery({ queryKey: ledgerKeys.wallet(projectId, walletId), queryFn: () => apiFetch<WalletDetail>(`${base(projectId)}/wallets/${walletId}`) });
}

export function useSaveWallet(projectId: string, walletId?: string) {
  return useLedgerMutation(projectId, (input: WalletInput) =>
    walletId
      ? apiFetch<Wallet>(`${base(projectId)}/wallets/${walletId}`, { method: "PATCH", json: input })
      : apiFetch<Wallet>(`${base(projectId)}/wallets`, { method: "POST", json: input }),
  );
}

export function useCreateBalanceCheck(projectId: string, walletId: string) {
  return useLedgerMutation(projectId, (input: BalanceCheckInput) =>
    apiFetch<BalanceCheck>(`${base(projectId)}/wallets/${walletId}/balance-checks`, { method: "POST", json: input }),
  );
}

export function useAdjustBalanceCheck(projectId: string) {
  return useLedgerMutation(projectId, ({ checkId, categoryId }: { checkId: string; categoryId: string | null }) =>
    apiFetch<Transaction>(`${base(projectId)}/balance-checks/${checkId}/adjust`, { method: "POST", json: { categoryId } }),
  );
}
