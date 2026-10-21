import "server-only";
import type { Db } from "@/db/types";
import { receiptsEnv, type ReceiptsEnv } from "@/lib/env";
import { ValidationError } from "@/lib/errors";
import { selectCategories } from "@/modules/budgets/api/categories-repo";
import { assertProjectEditable, findProjectOrThrow } from "@/modules/projects/services/projects";
import { putReceipt } from "../api/blob";
import { GeminiError, generateJson, type GeminiFailure } from "../api/gemini";
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

/** Total waktu scan (route `maxDuration` 60 detik); satu model maksimal 30 detik. */
const SCAN_BUDGET_MS = 55_000;
const MODEL_TIMEOUT_MS = 30_000;
const RETRY_NEXT_MODEL = new Set<GeminiFailure>(["busy", "quota", "timeout"]);

async function scan(db: Db, project: { id: string; startDate: string }, file: { mimeType: string; base64: string }, config: ReceiptsEnv): Promise<ScanResult> {
  if (!config.geminiApiKey) return { ok: false, reason: "unconfigured" };
  const categoryNames = (await selectCategories(db, project.id)).filter((c) => c.kind === "expense" && !c.archived).map((c) => c.name);
  const projectYear = Number(project.startDate.slice(0, 4));
  const deadline = Date.now() + SCAN_BUDGET_MS;
  let reason: GeminiFailure = "failed";
  // Model berikutnya hanya dicoba bila model sebelumnya sibuk/kuota/timeout (mis. 503 "high demand", 2026-10-21).
  for (const model of config.geminiModels) {
    const timeoutMs = Math.min(MODEL_TIMEOUT_MS, deadline - Date.now());
    if (timeoutMs < 5_000) break;
    try {
      const raw = await generateJson({
        apiKey: config.geminiApiKey,
        model,
        prompt: receiptPrompt(categoryNames, projectYear),
        file,
        schema: receiptResponseSchema(categoryNames),
        timeoutMs,
      });
      return { ok: true, scan: toReceiptScan(raw, { projectYear, categoryNames }) };
    } catch (error) {
      if (!(error instanceof GeminiError)) throw error;
      console.error("[gemini]", model, error.reason, error.message);
      reason = error.reason;
      if (!RETRY_NEXT_MODEL.has(reason)) break;
    }
  }
  return { ok: false, reason };
}
