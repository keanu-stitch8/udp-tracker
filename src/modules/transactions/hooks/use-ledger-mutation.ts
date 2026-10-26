import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/modules/notifications/hooks/keys";
import { ledgerKeys } from "./keys";

/** Mutasi yang memengaruhi angka buku kas (saldo, pagu, kalender) → invalidasi seluruh data proyek, termasuk notifikasi (tindak lanjut, aktivitas). */
export function useLedgerMutation<TInput, TResult>(projectId: string, fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ledgerKeys.all(projectId) }), queryClient.invalidateQueries({ queryKey: notificationKeys.all(projectId) })]),
  });
}
