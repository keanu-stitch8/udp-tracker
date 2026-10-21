import { getDb } from "@/db/client";
import { AppError, ServiceUnavailableError } from "@/lib/errors";
import { route } from "@/lib/http";
import { googleGateway } from "@/modules/exports/api/google-gateway";
import { exportReport } from "@/modules/exports/commands/export-report";
import { googleErrorMessage } from "@/modules/google/lib/google-errors";

// Unggah foto + tulis 4 tab bisa lama bila foto banyak / kuota Google menahan.
export const maxDuration = 300;

export const POST = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/export">) => {
  const { projectId } = await ctx.params;
  const db = getDb();
  try {
    return Response.json(await exportReport(db, projectId, { gateway: await googleGateway(db) }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("[ekspor]", projectId, error);
    throw new ServiceUnavailableError(googleErrorMessage(error));
  }
});
