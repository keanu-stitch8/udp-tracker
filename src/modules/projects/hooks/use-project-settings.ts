import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { useLedgerMutation } from "@/modules/transactions/hooks/use-ledger-mutation";
import type { ProjectSettings } from "../queries/project-settings";
import type { Project, Vehicle } from "../types/project";
import type { UpdateProjectInput } from "../types/project-input";
import type { VehicleInput } from "../types/vehicle-input";
import { projectKeys } from "./keys";

const base = (projectId: string) => `/api/projects/${projectId}`;

export function useProjectSettings(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.settings(projectId), queryFn: () => apiFetch<ProjectSettings>(`${base(projectId)}/settings`) });
}

/** Periode/jumlah orang memengaruhi pagu; nama & tanggal tampil di header (server) → refresh route juga. Pindah divisi mengubah jumlah proyek per divisi. */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => apiFetch<Project>(base(projectId), { method: "PATCH", json: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.all(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: divisionKeys.all });
      router.refresh();
    },
  });
}

export function useSaveVehicle(projectId: string, vehicleId?: string) {
  return useLedgerMutation(projectId, (input: VehicleInput) =>
    vehicleId
      ? apiFetch<Vehicle>(`${base(projectId)}/vehicles/${vehicleId}`, { method: "PATCH", json: input })
      : apiFetch<Vehicle>(`${base(projectId)}/vehicles`, { method: "POST", json: input }),
  );
}

export function useDeleteVehicle(projectId: string) {
  return useLedgerMutation(projectId, (vehicleId: string) => apiFetch<void>(`${base(projectId)}/vehicles/${vehicleId}`, { method: "DELETE" }));
}

export function useDeleteProject(projectId: string) {
  return useMutation({ mutationFn: (name: string) => apiFetch<void>(base(projectId), { method: "DELETE", json: { name } }) });
}
