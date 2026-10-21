import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ExportResult } from "../types/gateway";

export function useExportReport(projectId: string) {
  return useMutation({ mutationFn: () => apiFetch<ExportResult>(`/api/projects/${projectId}/export`, { method: "POST" }) });
}

/** Hanya menghapus token di app (tidak mencabut izin di Google). */
export function useDisconnectGoogle() {
  return useMutation({ mutationFn: () => apiFetch<void>("/api/google", { method: "DELETE" }) });
}
