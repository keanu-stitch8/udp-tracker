import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { NotificationGroupKey } from "@/modules/shared/types/enums";
import { GROUP_SLUG } from "../lib/notifications";
import type { Notifications } from "../queries/notifications";
import { LIST_LIMIT, notificationKeys, SUMMARY_LIMIT } from "./keys";

const url = (projectId: string, group: NotificationGroupKey | null, limit: number) =>
  `/api/projects/${projectId}/notifications?limit=${limit}${group ? `&grup=${GROUP_SLUG[group]}` : ""}`;

/** Popover + badge lonceng: diperbarui tiap 60 detik dan saat tab kembali aktif. */
export function useNotificationSummary(projectId: string) {
  return useQuery({ queryKey: notificationKeys.summary(projectId), queryFn: () => apiFetch<Notifications>(url(projectId, null, SUMMARY_LIMIT)), refetchInterval: 60_000 });
}

export function useNotificationList(projectId: string, group: NotificationGroupKey | null) {
  return useQuery({ queryKey: notificationKeys.list(projectId, group), queryFn: () => apiFetch<Notifications>(url(projectId, group, LIST_LIMIT)) });
}

/** Hanya badge/popover yang di-refresh: titik unread di daftar yang sedang dibuka tetap tampil. */
export function useMarkSeen(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: NotificationGroupKey) => apiFetch<void>(`/api/projects/${projectId}/notifications/seen`, { method: "POST", json: { group } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.summary(projectId) }),
  });
}
