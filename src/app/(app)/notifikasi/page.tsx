import { NotificationsModule } from "@/modules/notifications";

export default function NotificationsPage({ searchParams }: PageProps<"/notifikasi">) {
  return <NotificationsModule searchParams={searchParams} />;
}
