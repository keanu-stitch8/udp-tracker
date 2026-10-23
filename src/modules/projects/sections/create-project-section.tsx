import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisionsFor } from "@/modules/divisions/queries/divisions";
import { todayWib } from "@/modules/shared/lib/date";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ProjectForm } from "../components/project-form";
import { canCreateProjects, getActiveProject } from "../queries/projects";

export async function CreateProjectSection() {
  await connection();
  const db = getDb();
  const user = await requireCurrentUser(db);
  if (!(await canCreateProjects(db, user))) notFound();
  const [divisions, active] = await Promise.all([listDivisionsFor(db, user), getActiveProject(db)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(divisionKeys.list(), divisions);
  // Bawaan: divisi proyek aktif bila boleh dipakai (biasanya proyek berikutnya di divisi yang sama), atau divisi pertama A–Z.
  const creatable = divisions.filter((d) => d.canCreateProject);
  const defaultDivisionId = creatable.find((d) => d.id === active?.divisionId)?.id ?? creatable[0]?.id ?? "";
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectForm today={todayWib()} defaultDivisionId={defaultDivisionId} />
    </HydrationBoundary>
  );
}
