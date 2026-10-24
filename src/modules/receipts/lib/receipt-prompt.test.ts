import { describe, expect, it } from "vitest";
import { receiptPrompt, receiptResponseSchema } from "./receipt-prompt";

describe("receiptPrompt", () => {
  it("memuat semua nama kategori", () => {
    const prompt = receiptPrompt(["Tol", "Makan Siang"], 2026);
    expect(prompt).toContain("Tol");
    expect(prompt).toContain("Makan Siang");
    expect(prompt).toMatch(/tahun tidak tertulis.*2026/);
  });

  it("biaya admin sesuai angka tertulis; nominal bukan Total Transfer; BI FAST hanya bila angka tidak tertulis", () => {
    const prompt = receiptPrompt([], 2026);
    expect(prompt).toContain("\"Fee: Rp2.000,00\" = 2000");
    expect(prompt).toContain("bukan \"Total Transfer\"");
    expect(prompt).toMatch(/BI FAST.*tidak tertulis.*2500/);
  });

  it("schema membatasi categoryHint ke kategori proyek", () => {
    const schema = receiptResponseSchema(["Tol", "Parkir"]);
    expect(schema.properties.categoryHint).toEqual({ type: "STRING", enum: ["Tol", "Parkir"], nullable: true });
    expect(schema.required).toEqual(["confident"]);
    expect(schema.properties.kind).toEqual({ type: "STRING", enum: ["receipt", "toll_history"] });
    expect(schema.properties.tolls.items.required).toEqual(["date", "time", "amount"]);
  });
});
