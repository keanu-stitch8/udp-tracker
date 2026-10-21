import { getDb } from "@/db/client";
import { NotFoundError } from "@/lib/errors";
import { route } from "@/lib/http";
import { getAttachmentFile } from "@/modules/receipts/queries/attachment-file";

export const GET = route(async (_request, ctx: RouteContext<"/api/projects/[projectId]/attachments/[attachmentId]">) => {
  const { projectId, attachmentId } = await ctx.params;
  const file = await getAttachmentFile(getDb(), projectId, attachmentId);
  if (!file) throw new NotFoundError("Lampiran tidak ditemukan.");
  return new Response(file.stream, { headers: { "content-type": file.contentType, "cache-control": "private, max-age=3600" } });
});
