import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSection } from "../sections/dashboard-section";

export function DashboardView() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DashboardSection />
    </Suspense>
  );
}
