import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { divisionKeys } from "@/modules/divisions/hooks/keys";
import { listDivisions } from "@/modules/divisions/queries/divisions";
import { todayWib } from "@/modules/shared/lib/date";
import { ProjectForm } from "../components/project-form";
import { getActiveProject } from "../queries/projects";

export async function CreateProjectSection() {
  await connection();
  const db = getDb();
  const [divisions, active] = await Promise.all([listDivisions(db), getActiveProject(db)]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(divisionKeys.list(), divisions);
  // Bawaan: divisi proyek aktif (biasanya proyek berikutnya di divisi yang sama), atau divisi pertama A–Z.
  const defaultDivisionId = active?.divisionId ?? divisions[0]?.id ?? "";
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectForm today={todayWib()} defaultDivisionId={defaultDivisionId} />
    </HydrationBoundary>
  );
}
