import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { DivisionSettings } from "../components/division-settings";
import { divisionKeys } from "../hooks/keys";
import { listDivisions } from "../queries/divisions";

export async function DivisionSettingsSection() {
  await connection();
  const queryClient = new QueryClient();
  queryClient.setQueryData(divisionKeys.list(), await listDivisions(getDb()));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DivisionSettings />
    </HydrationBoundary>
  );
}
