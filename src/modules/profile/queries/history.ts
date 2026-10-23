import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { selectDivisions } from "@/modules/divisions/api/divisions-repo";
import { listProjects } from "@/modules/projects/queries/projects";
import type { Project } from "@/modules/projects/types/project";
import { toTransactionViews } from "@/modules/transactions/lib/ledger";
import { getLedger, refsOf } from "@/modules/transactions/queries/ledger";
import { selectPmDivisionIds } from "@/modules/users/api/access-repo";
import { selectUser } from "@/modules/users/api/users-repo";
import type { CurrentUser } from "@/modules/users/types/user";
import { selectBalanceChecks } from "@/modules/wallets/api/balance-checks-repo";
import { selectProjectHolderHistory } from "@/modules/wallets/api/holders-repo";
import { toWalletHolderRecord } from "@/modules/wallets/mappers/wallet-holder";
import { selectTracedProjectIds } from "../api/profile-repo";
import { heldWallets, inputByCategory, inputSummary, inputTransactions } from "../lib/history";
import type { PersonHistory, PersonProjectDetail, PersonProjectSummary, ProfilePerson } from "../types/history";

/**
 * Hak lihat riwayat (spec profil riwayat): diri sendiri & Root → semua proyek riwayatnya; PM → proyek di divisinya;
 * selain itu, atau user tidak ada → 404.
 */
async function resolveAccess(db: Db, viewer: CurrentUser, subjectId: string): Promise<{ person: ProfilePerson; canSee: (project: Project) => boolean; isSelf: boolean }> {
  const row = z.uuid().safeParse(subjectId).success ? await selectUser(db, subjectId) : undefined;
  if (!row) throw new NotFoundError("Pengguna tidak ditemukan.");
  const person = { id: row.id, name: row.name, email: row.email, imageUrl: row.imageUrl };
  const isSelf = viewer.id === row.id;
  if (isSelf || viewer.isRoot) return { person, canSee: () => true, isSelf };
  const pmDivisions = new Set(await selectPmDivisionIds(db, viewer.id));
  if (!pmDivisions.size) throw new NotFoundError("Pengguna tidak ditemukan.");
  return { person, canSee: (p) => pmDivisions.has(p.divisionId), isSelf };
}

async function summarize(db: Db, userId: string, project: Project, divisionName: string): Promise<PersonProjectSummary> {
  const [ledger, holderRows] = await Promise.all([getLedger(db, project.id), selectProjectHolderHistory(db, project.id)]);
  const holderHistory = holderRows.map(toWalletHolderRecord);
  const heldIds = [...new Set(holderHistory.filter((h) => h.userId === userId).map((h) => h.walletId))];
  const lastChecks = await Promise.all(heldIds.map(async (id) => [id, (await selectBalanceChecks(db, id))[0]] as const));
  const lastCheckDifference = new Map(lastChecks.filter(([, check]) => check).map(([id, check]) => [id, check!.actualBalance - check!.computedBalance]));
  return {
    project: { id: project.id, name: project.name, startDate: project.startDate, endDate: project.endDate, status: project.status, divisionName },
    wallets: heldWallets(userId, { wallets: ledger.wallets, transactions: ledger.transactions, holderHistory, lastCheckDifference }),
    input: inputSummary(userId, ledger.transactions, ledger.categories),
  };
}

async function visibleTracedProjects(db: Db, subjectId: string, canSee: (p: Project) => boolean) {
  const [traced, projects, divisions] = await Promise.all([selectTracedProjectIds(db, subjectId), listProjects(db), selectDivisions(db)]);
  const divisionName = new Map(divisions.map((d) => [d.id, d.name]));
  const ids = new Set(traced);
  // listProjects sudah urut terbaru dulu.
  return projects.filter((p) => ids.has(p.id) && canSee(p)).map((p) => ({ project: p, divisionName: divisionName.get(p.divisionId) ?? "—" }));
}

export const getPersonHistory = cache(async (db: Db, viewer: CurrentUser, subjectId: string): Promise<PersonHistory> => {
  const { person, canSee, isSelf } = await resolveAccess(db, viewer, subjectId);
  const visible = await visibleTracedProjects(db, person.id, canSee);
  return { person, isSelf, projects: await Promise.all(visible.map(({ project, divisionName }) => summarize(db, person.id, project, divisionName))) };
});

export const getPersonProjectHistory = cache(async (db: Db, viewer: CurrentUser, subjectId: string, projectId: string): Promise<PersonProjectDetail> => {
  const { person, canSee } = await resolveAccess(db, viewer, subjectId);
  const found = (await visibleTracedProjects(db, person.id, canSee)).find((v) => v.project.id === projectId);
  if (!found) throw new NotFoundError("Riwayat proyek tidak ditemukan.");
  const [summary, ledger] = await Promise.all([summarize(db, person.id, found.project, found.divisionName), getLedger(db, projectId)]);
  return {
    person,
    summary,
    categories: inputByCategory(person.id, ledger.transactions, ledger.categories),
    transactions: toTransactionViews(inputTransactions(person.id, ledger.transactions), refsOf(ledger)),
  };
});
