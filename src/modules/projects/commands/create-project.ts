import "server-only";
import type { Db } from "@/db/types";
import { insertBudget, insertBudgetCategories } from "@/modules/budgets/api/budgets-repo";
import { insertCategories } from "@/modules/budgets/api/categories-repo";
import { insertWallets } from "@/modules/wallets/api/wallets-repo";
import { insertProject } from "../api/projects-repo";
import { insertVehicles } from "../api/vehicles-repo";
import { buildProjectDefaults } from "../lib/seed-defaults";
import { toProject } from "../mappers/project";
import { parseCreateProject } from "../services/projects";
import type { Project } from "../types/project";

/** Buat proyek + seed default (spec §3.2) dalam satu transaksi: gagal di tengah → tidak ada yang tersimpan. */
export async function createProject(db: Db, input: unknown): Promise<Project> {
  const data = parseCreateProject(input);
  return db.transaction(async (tx) => {
    const project = await insertProject(tx, {
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
    const categoryRows = await insertCategories(
      tx,
      defaults.categories.map((category, index) => ({ ...category, projectId: project.id, sortOrder: index })),
    );
    for (const seed of defaults.budgets) {
      const budget = await insertBudget(tx, { projectId: project.id, name: seed.name, rate: seed.rate, basis: seed.basis, note: seed.note });
      const ids = categoryRows.filter((c) => seed.categoryNames.includes(c.name)).map((c) => c.id);
      await insertBudgetCategories(tx, budget.id, ids);
    }
    return toProject(project);
  });
}
