import type { ProjectStatus } from "@/modules/shared/types/enums";
import type { Role } from "@/modules/users/lib/access";

export interface Project {
  id: string;
  divisionId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  pax: number;
  status: ProjectStatus;
  sheetUrl: string | null;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string | null;
}

export interface ProjectDetail extends Project {
  days: number;
  vehicles: Vehicle[];
}

/** Proyek yang sedang dibuka + peran user di proyek itu (menentukan menu dan tombol yang tampil). */
export interface ActiveProject extends ProjectDetail {
  role: Role;
}
