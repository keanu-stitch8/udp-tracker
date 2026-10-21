import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Project } from "../types/project";
import type { CreateProjectInput } from "../types/project-input";
import { projectKeys } from "./keys";

export function useProjects() {
  return useQuery({ queryKey: projectKeys.list(), queryFn: () => apiFetch<Project[]>("/api/projects") });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => apiFetch<Project>("/api/projects", { method: "POST", json: input }),
    // Proyek baru mengubah semua data per proyek (beranda, kalender, dst.) → buang seluruh cache.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useActivateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/projects/${id}/activate`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
