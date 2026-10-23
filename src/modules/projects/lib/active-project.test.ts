import { describe, expect, it } from "vitest";
import type { Project } from "../types/project";
import { pickActiveProject } from "./active-project";

const project = (id: string, status: Project["status"]): Project => ({
  id,
  divisionId: "d1",
  name: id,
  location: "",
  startDate: "2026-10-20",
  endDate: "2026-10-25",
  pax: 9,
  status,
  sheetUrl: null,
});

describe("pickActiveProject", () => {
  const list = [project("a", "done"), project("b", "active"), project("c", "active")];
  it("memakai id dari cookie bila ada", () => {
    expect(pickActiveProject(list, "c")?.id).toBe("c");
  });
  it("cookie kosong/usang → proyek berjalan pertama (urutan terbaru)", () => {
    expect(pickActiveProject(list, undefined)?.id).toBe("b");
    expect(pickActiveProject(list, "hilang")?.id).toBe("b");
  });
  it("semua selesai → proyek pertama; kosong → null", () => {
    expect(pickActiveProject([project("a", "done")], undefined)?.id).toBe("a");
    expect(pickActiveProject([], undefined)).toBeNull();
  });
});
