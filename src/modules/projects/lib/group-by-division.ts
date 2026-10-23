import type { Division } from "@/modules/divisions/types/division";
import type { Project } from "../types/project";

export interface DivisionProjects {
  division: Division;
  projects: Project[];
}

/** Proyek dikelompokkan per divisi (A–Z); divisi tanpa proyek tidak tampil, urutan proyek mengikuti input. */
export function groupProjectsByDivision(projects: Project[], divisions: Division[]): DivisionProjects[] {
  return [...divisions]
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .map((division) => ({ division, projects: projects.filter((p) => p.divisionId === division.id) }))
    .filter((group) => group.projects.length > 0);
}
