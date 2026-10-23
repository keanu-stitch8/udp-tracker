import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuSection } from "../sections/menu-section";

export function MenuView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Lainnya</h1>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <MenuSection />
      </Suspense>
    </div>
  );
}
