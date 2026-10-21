import { describe, expect, it } from "vitest";
import { receiptPrompt, receiptResponseSchema } from "./receipt-prompt";

describe("receiptPrompt", () => {
  it("memuat semua nama kategori", () => {
    const prompt = receiptPrompt(["Tol", "Makan Siang"], 2026);
    expect(prompt).toContain("Tol");
    expect(prompt).toContain("Makan Siang");
    expect(prompt).toMatch(/tahun tidak tertulis.*2026/);
  });

  it("schema membatasi categoryHint ke kategori proyek", () => {
    const schema = receiptResponseSchema(["Tol", "Parkir"]);
    expect(schema.properties.categoryHint).toEqual({ type: "STRING", enum: ["Tol", "Parkir"], nullable: true });
    expect(schema.required).toEqual(["confident"]);
  });
});
