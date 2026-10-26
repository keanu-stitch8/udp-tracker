import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { getCurrentUser } from "@/modules/users/queries/current-user";
import { NotificationBell } from "../components/notification-bell";
import { notificationKeys, SUMMARY_LIMIT } from "../hooks/keys";
import { getNotifications } from "../queries/notifications";

/** Lonceng hanya bila ada proyek aktif. Saat "Lihat sebagai", isinya milik orang yang dilihat. */
export async function NotificationBellSection() {
  await connection();
  const db = getDb();
  const [project, user] = await Promise.all([getActiveProject(db), getCurrentUser(db)]);
  if (!project || !user) return null;
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    notificationKeys.summary(project.id),
    await getNotifications(db, { projectId: project.id, user, role: project.role, scope: project.walletScope }, { limit: SUMMARY_LIMIT }),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationBell projectId={project.id} />
    </HydrationBoundary>
  );
}
