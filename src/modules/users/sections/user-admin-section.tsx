import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisions } from "@/modules/divisions/queries/divisions";
import { UserAdmin } from "../components/user-admin";
import { userKeys } from "../hooks/keys";
import { requireCurrentUser } from "../queries/current-user";
import { listUsers } from "../queries/users";

/** Khusus Root (spec akses §4). */
export async function UserAdminSection() {
  await connection();
  const db = getDb();
  if (!(await requireCurrentUser(db)).isRoot) notFound();
  const [users, divisions] = await Promise.all([listUsers(db), listDivisions(db)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(userKeys.list(), users);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserAdmin />
    </HydrationBoundary>
  );
}
