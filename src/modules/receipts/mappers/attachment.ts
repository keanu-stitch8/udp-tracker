import type { AttachmentRow } from "../api/attachments-repo";
import { RECEIPT_MIMES, type ReceiptMime } from "../types/receipt";
import type { Attachment } from "../types/attachment";

export function toAttachment(row: AttachmentRow, projectId: string): Attachment {
  const mimeType = (RECEIPT_MIMES as readonly string[]).includes(row.mimeType) ? (row.mimeType as ReceiptMime) : "image/jpeg";
  return {
    id: row.id,
    transactionId: row.transactionId,
    pathname: row.blobPathname,
    blobUrl: row.blobUrl,
    mimeType,
    sizeBytes: row.sizeBytes,
    url: `/api/projects/${projectId}/attachments/${row.id}`,
  };
}
