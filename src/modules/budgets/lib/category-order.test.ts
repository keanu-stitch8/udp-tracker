import { describe, expect, it } from "vitest";
import { sortCategoriesForPicker } from "./category-order";

const names = (list: { name: string }[]) => list.map((c) => c.name);

describe("sortCategoriesForPicker", () => {
  it("A–Z, Lain-lain/Lainnya di akhir", () => {
    const input = ["Makan Siang", "Lain-lain", "BBM Perjalanan", "Tol", "Lainnya", "bensin Harian", "Parkir"].map((name) => ({ name }));
    expect(names(sortCategoriesForPicker(input))).toEqual(["BBM Perjalanan", "bensin Harian", "Makan Siang", "Parkir", "Tol", "Lain-lain", "Lainnya"]);
  });
  it("tidak mengubah array asal", () => {
    const input = [{ name: "Tol" }, { name: "Parkir" }];
    sortCategoriesForPicker(input);
    expect(names(input)).toEqual(["Tol", "Parkir"]);
  });
});
