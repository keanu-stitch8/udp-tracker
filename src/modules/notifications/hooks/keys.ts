import type { NotificationGroupKey } from "@/modules/shared/types/enums";

// Di luar ["ledger", projectId]: angka unread berubah juga saat orang lain mencatat, jadi diperbarui berkala.
export const notificationKeys = {
  all: (projectId: string) => ["notifications", projectId] as const,
  summary: (projectId: string) => [...notificationKeys.all(projectId), "summary"] as const,
  list: (projectId: string, group: NotificationGroupKey | null) => [...notificationKeys.all(projectId), "list", group ?? "all"] as const,
};

/** Popover: item per grup. Halaman: item per grup sekali muat. */
export const SUMMARY_LIMIT = 5;
export const LIST_LIMIT = 100;
