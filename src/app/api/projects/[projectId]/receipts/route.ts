import { getDb } from "@/db/client";
import { ValidationError } from "@/lib/errors";
import { route } from "@/lib/http";
import { uploadReceipt } from "@/modules/receipts/services/upload-receipt";

// Scan Gemini bisa ±10–30 detik.
export const maxDuration = 60;

export const POST = route(async (request, ctx: RouteContext<"/api/projects/[projectId]/receipts">) => {
  const { projectId } = await ctx.params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ValidationError({ file: ["Pilih foto atau PDF bon."] });
  return Response.json(await uploadReceipt(getDb(), projectId, file));
});
