import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectSection } from "../sections/create-project-section";

export function CreateProjectView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Proyek baru</h1>
      <p className="text-sm text-muted-foreground">
        Dompet (Rekening, Cash, Flazz per mobil) dan kategori dibuat otomatis. Pagu diatur sendiri di Lainnya → Pagu.
      </p>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CreateProjectSection />
      </Suspense>
    </div>
  );
}
