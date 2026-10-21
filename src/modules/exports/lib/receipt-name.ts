import { RECEIPT_EXTENSIONS, type ReceiptMime } from "@/modules/receipts/types/receipt";

/** Nama file bon di Drive (spec §6.2): `2026-10-20_001_Makan Siang_600000.jpg`. */
export function receiptFileName(input: { date: string; seq: number; category: string | null; amount: number; mimeType: ReceiptMime }): string {
  const category = (input.category ?? "Transfer").replace(/[/\\:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return `${input.date}_${String(input.seq).padStart(3, "0")}_${category}_${input.amount}.${RECEIPT_EXTENSIONS[input.mimeType]}`;
}
