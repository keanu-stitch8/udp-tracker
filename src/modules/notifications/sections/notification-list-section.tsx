import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireActiveProject } from "@/modules/projects/queries/projects";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { NotificationList } from "../components/notification-list";
import { LIST_LIMIT, notificationKeys } from "../hooks/keys";
import { groupFromSlug, groupKeysFor } from "../lib/notifications";
import { getNotifications } from "../queries/notifications";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `?grup=slug`; slug tak dikenal atau grup di luar hak peran → Semua. */
export async function NotificationListSection({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const db = getDb();
  const [project, user, params] = await Promise.all([requireActiveProject(db), requireCurrentUser(db), searchParams]);
  const groupKeys = groupKeysFor(user);
  const requested = groupFromSlug(typeof params.grup === "string" ? params.grup : null);
  const group = requested && groupKeys.includes(requested) ? requested : null;
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    notificationKeys.list(project.id, group),
    await getNotifications(db, { projectId: project.id, user, role: project.role, scope: project.walletScope }, { group, limit: LIST_LIMIT }),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationList projectId={project.id} group={group} groupKeys={groupKeys} />
    </HydrationBoundary>
  );
}
