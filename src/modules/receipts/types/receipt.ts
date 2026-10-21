export const RECEIPT_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type ReceiptMime = (typeof RECEIPT_MIMES)[number];
export const RECEIPT_EXTENSIONS: Record<ReceiptMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
/** Batas body fungsi Vercel 4,5 MB; gambar sudah dikompres di browser (±300 KB). */
export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
export const MAX_RECEIPT_AMOUNT = 100_000_000;

/** Hasil scan kanonik (spec §6.1); field yang tidak yakin = null. */
export interface ReceiptScan {
  date: string | null;
  amount: number | null;
  merchant: string | null;
  categoryHint: string | null;
  confident: boolean;
}

export type ScanFailure = "quota" | "timeout" | "failed" | "unconfigured";
export type ScanResult = { ok: true; scan: ReceiptScan } | { ok: false; reason: ScanFailure };

/** Lampiran yang sudah di Blob tapi belum tersimpan sebagai baris `attachments`. */
export interface AttachmentDraft {
  pathname: string;
  blobUrl: string;
  mimeType: ReceiptMime;
  sizeBytes: number;
}

export interface UploadReceiptResult {
  attachment: AttachmentDraft;
  scan: ScanResult;
}
