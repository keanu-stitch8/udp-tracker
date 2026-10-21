import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectSection } from "../sections/create-project-section";

export function CreateProjectView() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Dompet (Rekening, Cash, Flazz per mobil) dan kategori dibuat otomatis. Pagu diatur sendiri di Lainnya → Pagu.
      </p>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CreateProjectSection />
      </Suspense>
    </div>
  );
}
