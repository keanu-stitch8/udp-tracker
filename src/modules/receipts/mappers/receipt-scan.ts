// Trust boundary: JSON Gemini → ReceiptScan. Field yang tidak masuk akal menjadi null, bukan error (spec §6.1).
import { isIsoDate } from "@/modules/shared/lib/date";
import { MAX_RECEIPT_AMOUNT, type ReceiptScan } from "../types/receipt";

function toAmount(value: unknown): number | null {
  let amount: number | null = null;
  if (typeof value === "number") amount = value;
  else if (typeof value === "string") {
    const digits = value.replace(/[^\d.,]/g, "").replace(/,\d{1,2}$/, "").replace(/[.,]/g, "");
    amount = digits ? Number(digits) : null;
  }
  return amount !== null && Number.isInteger(amount) && amount > 0 && amount <= MAX_RECEIPT_AMOUNT ? amount : null;
}

function toDate(value: unknown, projectYear: number): string | null {
  if (typeof value !== "string" || !isIsoDate(value)) return null;
  return Math.abs(Number(value.slice(0, 4)) - projectYear) <= 1 ? value : null;
}

function toText(value: unknown, max: number): string | null {
  return typeof value === "string" ? value.trim().slice(0, max) || null : null;
}

export function toReceiptScan(raw: unknown, refs: { projectYear: number; categoryNames: string[] }): ReceiptScan {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const amount = toAmount(r.amount);
  const hint = typeof r.categoryHint === "string" ? r.categoryHint.trim().toLowerCase() : null;
  return {
    date: toDate(r.date, refs.projectYear),
    amount,
    merchant: toText(r.merchant, 100),
    categoryHint: refs.categoryNames.find((name) => name.toLowerCase() === hint) ?? null,
    confident: r.confident === true && amount !== null,
  };
}
