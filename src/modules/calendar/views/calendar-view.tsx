import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarSection } from "../sections/calendar-section";

export function CalendarView() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CalendarSection />
    </Suspense>
  );
}
