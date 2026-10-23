"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

/** Penanda mode "Lihat sebagai" (spec pemegang dompet) + tombol keluar. */
export function ViewAsBanner({ name }: { name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  const exit = () =>
    startTransition(async () => {
      try {
        await apiFetch<void>("/api/view-as", { method: "DELETE" });
        await queryClient.invalidateQueries();
        router.push("/lainnya/anggota");
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  return (
    <div role="status" className="mb-4 flex items-center gap-3 border-2 bg-primary px-3 py-2 shadow-md">
      <Eye className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        Melihat sebagai <span className="font-bold">{name}</span>. Data tidak bisa diubah.
      </p>
      <Button size="sm" variant="outline" className="bg-card" disabled={pending} onClick={exit}>
        Keluar
      </Button>
    </div>
  );
}
