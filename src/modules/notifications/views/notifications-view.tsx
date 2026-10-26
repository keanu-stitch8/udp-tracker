import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationListSection } from "../sections/notification-list-section";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function NotificationsView({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NotificationListSection searchParams={searchParams} />
    </Suspense>
  );
}
