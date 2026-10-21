import "server-only";
import type { Db } from "@/db/types";
import { receiptsEnv, type ReceiptsEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { putReceipt } from "../api/blob";
import { GeminiError, generateJson } from "../api/gemini";
import { receiptPrompt, receiptResponseSchema } from "../lib/receipt-prompt";
import { toReceiptScan } from "../mappers/receipt-scan";
import { MAX_RECEIPT_BYTES, RECEIPT_EXTENSIONS, RECEIPT_MIMES, type ReceiptMime, type ScanResult, type UploadReceiptResult } from "../types/receipt";

const isReceiptMime = (type: string): type is ReceiptMime => (RECEIPT_MIMES as readonly string[]).includes(type);

/** Satu request: simpan ke Blob, lalu scan dari byte yang sama. Scan gagal tidak menggagalkan upload (spec §6.1). */
export async function uploadReceipt(db: Db, projectId: string, file: File, config: ReceiptsEnv = receiptsEnv()): Promise<UploadReceiptResult> {
  const project = await findProjectOrThrow(db, projectId);
  assertProjectEditable(project);
  const mimeType = file.type;
  if (!isReceiptMime(mimeType)) throw new ValidationError({ file: ["Bon harus foto (JPG/PNG/WebP) atau PDF."] });
  if (file.size > MAX_RECEIPT_BYTES) throw new ValidationError({ file: ["File terlalu besar (maksimal 4 MB)."] });

  const bytes = Buffer.from(await file.arrayBuffer());
  const pathname = `receipts/${projectId}/${crypto.randomUUID()}.${RECEIPT_EXTENSIONS[mimeType]}`;
  const blob = await putReceipt(pathname, new Blob([bytes], { type: mimeType }), mimeType);
  const attachment = { pathname: blob.pathname, blobUrl: blob.url, mimeType, sizeBytes: file.size };

  return { attachment, scan: await scan(db, project, { mimeType, base64: bytes.toString("base64") }, config) };
}

async function scan(db: Db, project: { id: string; startDate: string }, file: { mimeType: string; base64: string }, config: ReceiptsEnv): Promise<ScanResult> {
  if (!config.geminiApiKey) return { ok: false, reason: "unconfigured" };
  const categoryNames = (await selectCategories(db, project.id)).filter((c) => c.kind === "expense" && !c.archived).map((c) => c.name);
  try {
    const raw = await generateJson({
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
      prompt: receiptPrompt(categoryNames),
      file,
      schema: receiptResponseSchema(categoryNames),
    });
    return { ok: true, scan: toReceiptScan(raw, { projectYear: Number(project.startDate.slice(0, 4)), categoryNames }) };
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error("[gemini]", error.reason, error.message);
      return { ok: false, reason: error.reason };
    }
    throw error;
  }
}
