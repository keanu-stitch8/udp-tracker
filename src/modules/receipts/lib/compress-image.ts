// Client-only: kompres foto bon sebelum upload (spec §6.1: sisi terpanjang ≤ 1600px, JPEG q≈0.8).
import { MAX_RECEIPT_BYTES, RECEIPT_MIMES } from "../types/receipt";
import { fitWithin } from "./image-size";

const MAX_SIDE = 1600;

export async function compressReceipt(file: File): Promise<File> {
  if (file.type === "application/pdf") return assertUploadable(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Browser tidak bisa membaca formatnya (mis. HEIC di Chrome): kirim apa adanya bila diizinkan.
    return assertUploadable(file);
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) return assertUploadable(file);
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

function assertUploadable(file: File): File {
  if (!(RECEIPT_MIMES as readonly string[]).includes(file.type)) throw new Error("Format file tidak didukung. Pakai foto JPG/PNG atau PDF.");
  if (file.size > MAX_RECEIPT_BYTES) throw new Error("File terlalu besar (maksimal 4 MB).");
  return file;
}
