import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { userKeys } from "@/modules/users/hooks/keys";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { listUsers } from "@/modules/users/queries/users";
import { DivisionSettings } from "../components/division-settings";
import { divisionKeys } from "../hooks/keys";
import { listDivisions } from "../queries/divisions";

/** Khusus Root (spec akses §4). */
export async function DivisionSettingsSection() {
  await connection();
  const db = getDb();
  if (!(await requireCurrentUser(db)).isRoot) notFound();
  const queryClient = new QueryClient();
  const [divisions, users] = await Promise.all([listDivisions(db), listUsers(db)]);
  queryClient.setQueryData(divisionKeys.list(), divisions);
  // Pool user untuk pemilih PM.
  queryClient.setQueryData(userKeys.list(), users);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DivisionSettings />
    </HydrationBoundary>
  );
}
