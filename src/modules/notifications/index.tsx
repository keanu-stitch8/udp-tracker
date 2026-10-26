import { NotificationsView } from "./views/notifications-view";

export { NotificationBellSection } from "./sections/notification-bell-section";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function NotificationsModule({ searchParams }: { searchParams: SearchParams }) {
  return <NotificationsView searchParams={searchParams} />;
}
