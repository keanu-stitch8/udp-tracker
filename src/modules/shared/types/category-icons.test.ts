import { describe, expect, it } from "vitest";
import { hasCategoryIcon } from "@/components/app/category-icon";
import { CATEGORY_ICONS } from "./category-icons";

describe("ikon kategori", () => {
  it("setiap nama ikon yang bisa dipilih punya komponen ikon", () => {
    expect(CATEGORY_ICONS.length).toBeGreaterThanOrEqual(20);
    expect(CATEGORY_ICONS.filter((name) => !hasCategoryIcon(name))).toEqual([]);
  });
  it("ikon kategori seed termasuk daftar", () => {
    for (const name of ["sandwich", "utensils", "coffee", "cup-soda", "fuel", "ticket", "square-parking", "landmark", "ellipsis", "building-2", "circle-plus"]) {
      expect(CATEGORY_ICONS).toContain(name);
    }
  });
});
