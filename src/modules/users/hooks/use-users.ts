import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import type { UserListItem } from "../types/user-list";
import { userKeys } from "./keys";

export function useUsers() {
  return useQuery({ queryKey: userKeys.list(), queryFn: () => apiFetch<UserListItem[]>("/api/users") });
}

/** Status/Root tampil juga di halaman Divisi (nama PM) → ikut disegarkan. */
function useUserMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: userKeys.all }), queryClient.invalidateQueries({ queryKey: divisionKeys.all })]),
  });
}

export function useApproveUser() {
  return useUserMutation((userId: string) => apiFetch<void>(`/api/users/${userId}/approve`, { method: "POST" }));
}

export function useSetUserRoot() {
  return useUserMutation(({ userId, isRoot }: { userId: string; isRoot: boolean }) => apiFetch<void>(`/api/users/${userId}/root`, { method: "PUT", json: { isRoot } }));
}

export function useRejectUser() {
  return useUserMutation((userId: string) => apiFetch<void>(`/api/users/${userId}/reject`, { method: "POST" }));
}

/** Ganti daftar PM satu divisi (dipakai halaman Divisi). */
export function useSetDivisionPms() {
  return useUserMutation(({ divisionId, userIds }: { divisionId: string; userIds: string[] }) =>
    apiFetch<void>(`/api/divisions/${divisionId}/pms`, { method: "PUT", json: { userIds } }),
  );
}
