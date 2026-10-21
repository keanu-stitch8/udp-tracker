import "server-only";
import type { Db } from "@/db/types";
import { googleAccount } from "@/modules/google/services/google-oauth";
import type { GoogleAccount } from "@/modules/google/types/google";
import { selectProjectExport } from "../api/export-repo";

export interface ExportStatus {
  projectId: string;
  google: GoogleAccount;
  sheetUrl: string | null;
  folderUrl: string | null;
}

export async function getExportStatus(db: Db, projectId: string): Promise<ExportStatus> {
  const [project, google] = await Promise.all([selectProjectExport(db, projectId), googleAccount(db)]);
  return {
    projectId,
    google,
    sheetUrl: project?.sheetUrl ?? null,
    folderUrl: project?.driveFolderId ? `https://drive.google.com/drive/folders/${project.driveFolderId}` : null,
  };
}
