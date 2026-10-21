// Client-safe: dipakai form (tipe) dan service transaksi (validasi).
import { z } from "zod";
import { MAX_RECEIPT_BYTES, RECEIPT_MIMES, type ReceiptMime, type ReceiptScan } from "./receipt";

export interface Attachment {
  id: string;
  transactionId: string;
  pathname: string;
  blobUrl: string;
  mimeType: ReceiptMime;
  sizeBytes: number;
  /** Route app yang menyajikan file dari Blob private (cek sesi). */
  url: string;
}

const PATHNAME = /^receipts\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;

function isOwnBlobUrl(value: string, pathname: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".private.blob.vercel-storage.com") && url.pathname === `/${pathname}`;
  } catch {
    return false;
  }
}

const scanSchema = z.object({
  date: z.string().nullable(),
  // Hasil scan lama tersimpan tanpa time.
  time: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  amount: z.number().nullable(),
  merchant: z.string().nullable(),
  categoryHint: z.string().nullable(),
  confident: z.boolean(),
}) satisfies z.ZodType<ReceiptScan>;

export const attachmentDraftSchema = z
  .object({
    pathname: z.string().regex(PATHNAME, "Lampiran tidak valid."),
    blobUrl: z.string(),
    mimeType: z.enum(RECEIPT_MIMES, "Jenis lampiran tidak valid."),
    sizeBytes: z.number().int().min(1).max(MAX_RECEIPT_BYTES),
    ocr: scanSchema.nullish().transform((value) => value ?? null),
  })
  .refine((a) => isOwnBlobUrl(a.blobUrl, a.pathname), { path: ["blobUrl"], message: "Lampiran tidak valid." });

export const attachmentsInputSchema = z.array(attachmentDraftSchema).max(5, "Maksimal 5 lampiran.").optional();
export type AttachmentInput = z.output<typeof attachmentDraftSchema>;
