import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import type { DashboardSummary } from "../queries/summary";

export function useDashboardSummary(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.summary(projectId), queryFn: () => apiFetch<DashboardSummary>(`/api/projects/${projectId}/summary`) });
}
