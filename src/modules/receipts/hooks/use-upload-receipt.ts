import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { compressReceipt } from "../lib/compress-image";
import type { UploadReceiptResult } from "../types/receipt";

export function useUploadReceipt(projectId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", await compressReceipt(file));
      return apiFetch<UploadReceiptResult>(`/api/projects/${projectId}/receipts`, { method: "POST", form });
    },
  });
}
