import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportSection } from "../sections/export-section";

export function ExportView() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <ExportSection />
    </Suspense>
  );
}
