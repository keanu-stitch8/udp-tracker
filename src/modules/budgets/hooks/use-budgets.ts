import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { useLedgerMutation } from "@/modules/transactions/hooks/use-ledger-mutation";
import type { BudgetSettings } from "../queries/budget-settings";
import type { Budget } from "../types/budget";
import type { BudgetInput } from "../types/budget-input";

const base = (projectId: string) => `/api/projects/${projectId}/budgets`;

export function useBudgetSettings(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.budgets(projectId), queryFn: () => apiFetch<BudgetSettings>(base(projectId)) });
}

export function useSaveBudget(projectId: string, budgetId?: string) {
  return useLedgerMutation(projectId, (input: BudgetInput) =>
    budgetId ? apiFetch<Budget>(`${base(projectId)}/${budgetId}`, { method: "PATCH", json: input }) : apiFetch<Budget>(base(projectId), { method: "POST", json: input }),
  );
}

export function useDeleteBudget(projectId: string) {
  return useLedgerMutation(projectId, (budgetId: string) => apiFetch<void>(`${base(projectId)}/${budgetId}`, { method: "DELETE" }));
}
