import { describe, expect, it } from "vitest";
import { categories, groups } from "@tests/helpers/ledger-fixture";
import { groupCategories } from "./category-groups";

describe("groupCategories", () => {
  it("grup A–Z dengan Lain-lain terakhir; kategori di dalamnya urut picker; grup kosong dibuang kecuali diminta", () => {
    const expense = categories.filter((c) => c.kind === "expense");
    const extra = [...groups, { id: "venue", name: "Venue" }];
    expect(groupCategories(extra, expense).map((s) => [s.group.name, s.categories.map((c) => c.id)])).toEqual([
      ["Meal", ["makan-malam", "makan-siang"]],
      ["Transportation", ["tol"]],
      ["Lain-lain", ["admin"]],
    ]);
    expect(groupCategories(extra, expense, { keepEmpty: true }).map((s) => s.group.name)).toEqual(["Meal", "Transportation", "Venue", "Lain-lain"]);
  });
});
