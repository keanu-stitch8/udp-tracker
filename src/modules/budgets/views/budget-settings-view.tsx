import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetSettingsSection } from "../sections/budget-settings-section";

export function BudgetSettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Pagu</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BudgetSettingsSection />
      </Suspense>
    </div>
  );
}
