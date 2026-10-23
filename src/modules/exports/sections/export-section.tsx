import { connection } from "next/server";
import { getDb } from "@/db/client";
import { requireManagedProject } from "@/modules/projects/queries/projects";
import { requireCurrentUser } from "@/modules/users/queries/current-user";
import { ExportPanel } from "../components/export-panel";
import { getExportStatus } from "../queries/export-status";

export async function ExportSection() {
  await connection();
  const db = getDb();
  const project = await requireManagedProject(db);
  return <ExportPanel status={await getExportStatus(db, project.id, (await requireCurrentUser(db)).id)} />;
}
