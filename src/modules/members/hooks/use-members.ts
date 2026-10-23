import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AddMemberResult, ProjectMemberList } from "../types/member";
import { memberKeys } from "./keys";

const base = (projectId: string) => `/api/projects/${projectId}`;

export function useMembers(projectId: string) {
  return useQuery({ queryKey: memberKeys.list(projectId), queryFn: () => apiFetch<ProjectMemberList>(`${base(projectId)}/members`) });
}

function useMemberMutation<TInput, TResult>(projectId: string, mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(projectId) }) });
}

export function useAddMember(projectId: string) {
  return useMemberMutation(projectId, (email: string) => apiFetch<AddMemberResult>(`${base(projectId)}/members`, { method: "POST", json: { email } }));
}

export function useRemoveMember(projectId: string) {
  return useMemberMutation(projectId, (userId: string) => apiFetch<void>(`${base(projectId)}/members/${userId}`, { method: "DELETE" }));
}

export function useCancelInvitation(projectId: string) {
  return useMemberMutation(projectId, (email: string) => apiFetch<void>(`${base(projectId)}/invitations/${encodeURIComponent(email)}`, { method: "DELETE" }));
}
