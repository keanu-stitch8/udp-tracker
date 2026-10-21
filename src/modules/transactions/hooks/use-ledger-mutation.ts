import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ledgerKeys } from "./keys";

/** Mutasi yang memengaruhi angka buku kas (saldo, pagu, kalender) → invalidasi seluruh data proyek. */
export function useLedgerMutation<TInput, TResult>(projectId: string, fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ledgerKeys.all(projectId) }) });
}
