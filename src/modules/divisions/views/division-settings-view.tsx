import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DivisionSettingsSection } from "../sections/division-settings-section";

export function DivisionSettingsView() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <DivisionSettingsSection />
    </Suspense>
  );
}
