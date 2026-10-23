import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAdminSection } from "../sections/user-admin-section";

export function UserAdminView() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <UserAdminSection />
    </Suspense>
  );
}
