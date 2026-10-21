import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectSettingsSection } from "../sections/project-settings-section";

export function ProjectSettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Pengaturan proyek</h1>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <ProjectSettingsSection />
      </Suspense>
    </div>
  );
}
