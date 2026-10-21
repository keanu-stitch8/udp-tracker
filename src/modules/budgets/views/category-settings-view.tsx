import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategorySettingsSection } from "../sections/category-settings-section";

export function CategorySettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CategorySettingsSection />
      </Suspense>
    </div>
  );
}
