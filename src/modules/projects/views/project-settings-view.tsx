import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectSettingsSection } from "../sections/project-settings-section";

export function ProjectSettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <ProjectSettingsSection />
      </Suspense>
    </div>
  );
}
