import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireManagedProject } from "@/modules/projects/queries/projects";
import { MemberSettings } from "../components/member-settings";
import { memberKeys } from "../hooks/keys";
import { listProjectMembers } from "../queries/members";

export async function MemberSettingsSection() {
  await connection();
  const db = getDb();
  const project = await requireManagedProject(db);
  const queryClient = new QueryClient();
  queryClient.setQueryData(memberKeys.list(project.id), await listProjectMembers(db, project.id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MemberSettings projectId={project.id} projectName={project.name} />
    </HydrationBoundary>
  );
}
