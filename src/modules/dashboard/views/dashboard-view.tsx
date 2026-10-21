import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectOverviewSection } from "../sections/project-overview-section";

export function DashboardView() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <ProjectOverviewSection />
    </Suspense>
  );
}
