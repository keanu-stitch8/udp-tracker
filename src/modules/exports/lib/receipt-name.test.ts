import { describe, expect, it } from "vitest";
import { receiptFileName } from "./receipt-name";

describe("receiptFileName", () => {
  it("{tanggal}_{no 3 digit}_{kategori}_{nominal}.{ext}", () => {
    expect(receiptFileName({ date: "2026-10-20", seq: 1, category: "Makan Siang", amount: 600_000, mimeType: "image/jpeg" })).toBe("2026-10-20_001_Makan Siang_600000.jpg");
    expect(receiptFileName({ date: "2026-10-21", seq: 12, category: "Tol", amount: 50_000, mimeType: "application/pdf" })).toBe("2026-10-21_012_Tol_50000.pdf");
  });
  it("karakter terlarang di nama kategori dibuang; tanpa kategori → Transfer", () => {
    expect(receiptFileName({ date: "2026-10-20", seq: 2, category: 'Snack / Air "Minum"', amount: 1, mimeType: "image/png" })).toBe("2026-10-20_002_Snack Air Minum_1.png");
    expect(receiptFileName({ date: "2026-10-20", seq: 3, category: null, amount: 1, mimeType: "image/webp" })).toBe("2026-10-20_003_Transfer_1.webp");
  });
});
