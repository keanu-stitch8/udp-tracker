import { getDb } from "@/db/client";
import { AppError, ServiceUnavailableError } from "@/lib/errors";
import { projectRoute } from "@/lib/http";
import { googleGateway } from "@/modules/exports/api/google-gateway";
import { exportReport } from "@/modules/exports/commands/export-report";
import { googleErrorMessage } from "@/modules/google/lib/google-errors";

// Unggah foto + tulis 4 tab bisa lama bila foto banyak / kuota Google menahan.
export const maxDuration = 300;

export const POST = projectRoute("manage", async (_request, _ctx: RouteContext<"/api/projects/[projectId]/export">, { user, projectId }) => {
  const db = getDb();
  try {
    // File masuk ke Drive orang yang mengekspor (koneksi Google per user).
    return Response.json(await exportReport(db, projectId, { gateway: await googleGateway(db, user.id) }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("[ekspor]", projectId, error);
    throw new ServiceUnavailableError(googleErrorMessage(error));
  }
});
