import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { ExportPanel } from "../components/export-panel";
import { getExportStatus } from "../queries/export-status";

export async function ExportSection() {
  await connection();
  const db = getDb();
  const project = await getActiveProject(db);
  if (!project) redirect("/proyek/baru");
  return <ExportPanel status={await getExportStatus(db, project.id)} />;
}
