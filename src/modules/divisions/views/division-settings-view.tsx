import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { DivisionSettingsSection } from "../sections/division-settings-section";

export function DivisionSettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Divisi</h1>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <DivisionSettingsSection />
      </Suspense>
    </div>
  );
}
