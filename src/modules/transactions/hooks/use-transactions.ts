import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Transaction, TransactionView } from "../types/transaction";
import type { TransactionInput } from "../types/transaction-input";
import { ledgerKeys } from "./keys";

const base = (projectId: string) => `/api/projects/${projectId}/transactions`;

export function useTransactionList(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.transactions(projectId), queryFn: () => apiFetch<TransactionView[]>(base(projectId)) });
}

function useInvalidateLedger(projectId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all(projectId) });
}

export function useSaveTransaction(projectId: string, transactionId?: string) {
  const invalidate = useInvalidateLedger(projectId);
  return useMutation({
    mutationFn: (input: TransactionInput) =>
      transactionId
        ? apiFetch<Transaction>(`${base(projectId)}/${transactionId}`, { method: "PATCH", json: input })
        : apiFetch<Transaction>(base(projectId), { method: "POST", json: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction(projectId: string) {
  const invalidate = useInvalidateLedger(projectId);
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`${base(projectId)}/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Fungsi biasa (bukan hook): dipanggil dari tombol "Urungkan" di toast, yang bisa ditekan setelah form ditutup. */
export function restoreTransactionRequest(projectId: string, id: string) {
  return apiFetch<Transaction>(`${base(projectId)}/${id}/restore`, { method: "POST" });
}
