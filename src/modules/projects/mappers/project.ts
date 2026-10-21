import { daysInclusive } from "@/modules/shared/lib/date";
import type { ProjectRow } from "../api/projects-repo";
import type { VehicleRow } from "../api/vehicles-repo";
import type { Project, ProjectDetail, Vehicle } from "../types/project";

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    pax: row.pax,
    status: row.status,
    sheetUrl: row.sheetUrl,
  };
}

export function toVehicle(row: VehicleRow): Vehicle {
  return { id: row.id, name: row.name, plate: row.plate };
}

export function toProjectDetail(row: ProjectRow, vehicleRows: VehicleRow[]): ProjectDetail {
  return { ...toProject(row), days: daysInclusive(row.startDate, row.endDate), vehicles: vehicleRows.map(toVehicle) };
}
