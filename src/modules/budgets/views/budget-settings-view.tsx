import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetSettingsSection } from "../sections/budget-settings-section";

export function BudgetSettingsView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-head text-2xl">Pagu</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BudgetSettingsSection />
      </Suspense>
    </div>
  );
}
