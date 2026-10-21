import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { useLedgerMutation } from "@/modules/transactions/hooks/use-ledger-mutation";
import type { CategorySettings } from "../queries/category-settings";
import type { Category } from "../types/category";
import type { CategoryInput } from "../types/category-input";

const base = (projectId: string) => `/api/projects/${projectId}/categories`;

export function useCategorySettings(projectId: string) {
  return useQuery({ queryKey: ledgerKeys.categories(projectId), queryFn: () => apiFetch<CategorySettings>(base(projectId)) });
}

export function useSaveCategory(projectId: string, categoryId?: string) {
  return useLedgerMutation(projectId, (input: CategoryInput) =>
    categoryId ? apiFetch<Category>(`${base(projectId)}/${categoryId}`, { method: "PATCH", json: input }) : apiFetch<Category>(base(projectId), { method: "POST", json: input }),
  );
}
