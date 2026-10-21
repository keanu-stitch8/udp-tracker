import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectSection } from "../sections/create-project-section";

export function CreateProjectView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-head text-2xl">Proyek baru</h1>
      <p className="text-sm text-muted-foreground">
        Dompet (Rekening, Cash, Flazz per mobil), kategori, dan Pagu Makan Rp150.000/orang/hari dibuat otomatis. Semuanya bisa diubah nanti.
      </p>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CreateProjectSection />
      </Suspense>
    </div>
  );
}
