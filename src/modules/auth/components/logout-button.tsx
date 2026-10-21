"use client";

import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => apiFetch<void>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });
  return (
    <Button variant="outline" className="w-full justify-start" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      <LogOut /> Keluar
    </Button>
  );
}
