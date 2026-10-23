import { describe, expect, it } from "vitest";
import type { Division } from "@/modules/divisions/types/division";
import type { Project } from "../types/project";
import { groupProjectsByDivision } from "./group-by-division";

const division = (id: string, name: string): Division => ({ id, name, projectCount: 0, canCreateProject: true, pms: [] });
const project = (id: string, divisionId: string): Project => ({ id, divisionId, name: id, location: "", startDate: "2026-10-01", endDate: "2026-10-02", pax: 1, status: "active", sheetUrl: null });

describe("groupProjectsByDivision", () => {
  it("divisi A–Z, divisi kosong disembunyikan, urutan proyek dipertahankan", () => {
    const divisions = [division("mlsc", "MLSC"), division("umum", "Umum"), division("mkk", "MKK")];
    const projects = [project("part-2", "mkk"), project("bekasi", "mlsc"), project("part-1", "mkk")];
    expect(groupProjectsByDivision(projects, divisions).map((g) => [g.division.name, g.projects.map((p) => p.id)])).toEqual([
      ["MKK", ["part-2", "part-1"]],
      ["MLSC", ["bekasi"]],
    ]);
  });
});
