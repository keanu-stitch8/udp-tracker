import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { todayWib } from "@/modules/shared/lib/date";
import { ledgerKeys } from "@/modules/transactions/hooks/keys";
import { CalendarMonth } from "../components/calendar-month";
import { defaultCalendarMonth } from "../lib/month";
import { getCalendarMonth } from "../queries/calendar";

export async function CalendarSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  const today = todayWib();
  const month = defaultCalendarMonth(today, project.startDate, project.endDate);
  const queryClient = new QueryClient();
  queryClient.setQueryData(ledgerKeys.calendar(project.id, month), await getCalendarMonth(db, project.id, month));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarMonth projectId={project.id} initialMonth={month} today={today} startDate={project.startDate} endDate={project.endDate} />
    </HydrationBoundary>
  );
}
