import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { projectKeys } from "@/modules/projects/hooks/keys";
import type { Division } from "../types/division";
import type { DivisionInput } from "../types/division-input";
import { divisionKeys } from "./keys";

export function useDivisions() {
  return useQuery({ queryKey: divisionKeys.list(), queryFn: () => apiFetch<Division[]>("/api/divisions") });
}

/** Divisi tampil di pemilih proyek → simpan/hapus juga menyegarkan daftar proyek. */
function useDivisionMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: divisionKeys.all }), queryClient.invalidateQueries({ queryKey: projectKeys.all })]),
  });
}

export function useSaveDivision(divisionId?: string) {
  return useDivisionMutation((input: DivisionInput) =>
    divisionId ? apiFetch<Division>(`/api/divisions/${divisionId}`, { method: "PATCH", json: input }) : apiFetch<Division>("/api/divisions", { method: "POST", json: input }),
  );
}

export function useDeleteDivision() {
  return useDivisionMutation((divisionId: string) => apiFetch<void>(`/api/divisions/${divisionId}`, { method: "DELETE" }));
}
