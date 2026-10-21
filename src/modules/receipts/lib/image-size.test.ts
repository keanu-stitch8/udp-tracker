import { describe, expect, it } from "vitest";
import { fitWithin } from "./image-size";

describe("fitWithin", () => {
  it("mengecilkan sisi terpanjang ke batas, rasio tetap", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("gambar kecil tidak diperbesar", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
