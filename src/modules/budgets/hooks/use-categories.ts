import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { useLedgerMutation } from "@/modules/transactions/hooks/use-ledger-mutation";
import type { CategorySettings } from "../queries/category-settings";
import type { Category } from "../types/category";
import type { CategoryGroup } from "../types/category-group";
import type { CategoryGroupInput } from "../types/category-group-input";
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

const groupsBase = (projectId: string) => `/api/projects/${projectId}/category-groups`;

export function useSaveCategoryGroup(projectId: string, groupId?: string) {
  return useLedgerMutation(projectId, (input: CategoryGroupInput) =>
    groupId
      ? apiFetch<CategoryGroup>(`${groupsBase(projectId)}/${groupId}`, { method: "PATCH", json: input })
      : apiFetch<CategoryGroup>(groupsBase(projectId), { method: "POST", json: input }),
  );
}

export function useDeleteCategoryGroup(projectId: string) {
  return useLedgerMutation(projectId, ({ groupId, moveTo }: { groupId: string; moveTo?: string }) =>
    apiFetch<void>(`${groupsBase(projectId)}/${groupId}${moveTo ? `?pindahKe=${moveTo}` : ""}`, { method: "DELETE" }),
  );
}
