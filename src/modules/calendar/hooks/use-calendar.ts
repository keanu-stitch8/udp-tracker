import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import type { CalendarMonthData, DayDetail } from "../queries/calendar";

export function useCalendarMonth(projectId: string, month: string) {
  return useQuery({
    queryKey: ledgerKeys.calendar(projectId, month),
    queryFn: () => apiFetch<CalendarMonthData>(`/api/projects/${projectId}/calendar?month=${month}`),
    placeholderData: keepPreviousData,
  });
}

export function useDayDetail(projectId: string, date: string | null) {
  return useQuery({
    queryKey: ledgerKeys.day(projectId, date ?? ""),
    queryFn: () => apiFetch<DayDetail>(`/api/projects/${projectId}/days/${date}`),
    enabled: date !== null,
  });
}
