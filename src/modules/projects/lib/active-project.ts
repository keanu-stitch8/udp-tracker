import type { Project } from "../types/project";

export const ACTIVE_PROJECT_COOKIE = "udp_project";

/** Proyek yang ditampilkan: pilihan cookie → proyek berjalan terbaru → proyek terbaru → null. `projects` sudah urut terbaru. */
export function pickActiveProject(projects: Project[], cookieId: string | undefined): Project | null {
  return projects.find((p) => p.id === cookieId) ?? projects.find((p) => p.status === "active") ?? projects[0] ?? null;
}
