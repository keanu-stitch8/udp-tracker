import type { ProjectStatus } from "@/modules/shared/types/enums";

export interface Project {
  id: string;
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
