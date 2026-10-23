import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberSettingsSection } from "../sections/member-settings-section";

export function MemberSettingsView() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <MemberSettingsSection />
    </Suspense>
  );
}
