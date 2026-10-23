import "server-only";
import type { Db } from "@/db/types";
import { insertCategories } from "@/modules/budgets/api/categories-repo";
import { insertCategoryGroups } from "@/modules/budgets/api/category-groups-repo";
import { insertWallets } from "@/modules/wallets/api/wallets-repo";
import { insertProject } from "../api/projects-repo";
import { insertVehicles } from "../api/vehicles-repo";
import { buildProjectDefaults } from "../lib/seed-defaults";
import { toProject } from "../mappers/project";
import { assertDivisionExists, parseCreateProject } from "../services/projects";
import type { Project } from "../types/project";

/** Buat proyek + seed default (spec §3.2) dalam satu transaksi: gagal di tengah → tidak ada yang tersimpan. */
export async function createProject(db: Db, input: unknown): Promise<Project> {
  const data = parseCreateProject(input);
  await assertDivisionExists(db, data.divisionId);
  return db.transaction(async (tx) => {
    const project = await insertProject(tx, {
      divisionId: data.divisionId,
      name: data.name,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      pax: data.pax,
    });
    const vehicleRows = await insertVehicles(
      tx,
      data.vehicles.map((name, index) => ({ projectId: project.id, name, sortOrder: index })),
    );
    const defaults = buildProjectDefaults(vehicleRows.map((v) => ({ id: v.id, name: v.name })));
    await insertWallets(
      tx,
      defaults.wallets.map((wallet, index) => ({ ...wallet, projectId: project.id, sortOrder: index })),
    );
    const groupRows = await insertCategoryGroups(
      tx,
      defaults.groups.map((name) => ({ projectId: project.id, name })),
    );
    const groupId = new Map(groupRows.map((g) => [g.name, g.id]));
    await insertCategories(
      tx,
      defaults.categories.map(({ group, ...category }, index) => ({ ...category, groupId: group ? groupId.get(group)! : null, projectId: project.id, sortOrder: index })),
    );
    return toProject(project);
  });
}
