import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectListSection } from "../sections/project-list-section";

export function ProjectListView() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full" />}>
      <ProjectListSection />
    </Suspense>
  );
}
