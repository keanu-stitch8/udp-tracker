import "server-only";
import { readReceipt } from "@/modules/receipts/api/blob";

/** Isi file bon dari Blob private; null bila file-nya sudah tidak ada. */
export async function readReceiptBuffer(pathname: string): Promise<Buffer | null> {
  const result = await readReceipt(pathname);
  if (!result || result.statusCode !== 200) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}
