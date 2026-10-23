import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { setDivisionPms } from "@/modules/divisions/commands/division-pms";
import { createDivision } from "@/modules/divisions/commands/save-division";
import { removeMember } from "@/modules/members/commands/members";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { insertProjectMembers } from "@/modules/users/api/access-repo";
import type { CurrentUser } from "@/modules/users/types/user";
import { setWalletHolders } from "@/modules/wallets/commands/wallet-holders";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { getPersonHistory, getPersonProjectHistory } from "./queries/history";

let db: Db;
let projectId: string;
let pm: CurrentUser;
let arpan: CurrentUser;

beforeEach(async () => {
  db = await createTestDb();
  const divisionId = await testDivisionId(db);
  projectId = (await createProject(db, testRoot, { divisionId, name: "MKK Q4", startDate: "2026-10-20", endDate: "2026-10-25", pax: 4, vehicles: [] })).id;
  pm = await createTestUser(db, { email: "pm@example.com", name: "PM" });
  arpan = await createTestUser(db, { email: "arpan@example.com", name: "Arpan" });
  await setDivisionPms(db, divisionId, { userIds: [pm.id] });
  await insertProjectMembers(db, [{ projectId, userId: arpan.id, addedBy: null }]);
  const reference = await getTransactionReference(db, projectId);
  const cash = reference.wallets.find((w) => w.name === "Cash")!.id;
  const tol = reference.categories.find((c) => c.name === "Tol")!.id;
  await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
  await createTransaction(db, projectId, { type: "expense", date: "2026-10-20", time: "09:00", amount: 30_000, walletId: cash, categoryId: tol }, { userId: arpan.id, scope: [cash] });
});

describe("profil riwayat", () => {
  it("riwayat sendiri tetap ada setelah dikeluarkan dari proyek, lengkap dengan dompet yang pernah dipegang", async () => {
    await removeMember(db, pm, projectId, arpan.id);
    const history = await getPersonHistory(db, arpan, arpan.id);
    expect(history.isSelf).toBe(true);
    expect(history.projects).toHaveLength(1);
    const [summary] = history.projects;
    expect(summary.input).toEqual({ count: 1, income: 0, expense: 30_000 });
    expect(summary.wallets.map((w) => [w.name, w.balance, w.periods.map((p) => p.revokeReason)])).toEqual([["Cash", -30_000, ["removed"]]]);

    const detail = await getPersonProjectHistory(db, arpan, arpan.id, projectId);
    expect(detail.categories).toEqual([expect.objectContaining({ name: "Tol", amount: 30_000 })]);
    expect(detail.transactions.map((t) => t.createdByName)).toEqual(["Arpan"]);
  });

  it("PM melihat riwayat di divisinya saja; Root semua; orang lain 404", async () => {
    expect((await getPersonHistory(db, pm, arpan.id)).projects).toHaveLength(1);
    expect((await getPersonHistory(db, { ...testRoot, email: "r@x.id", name: null, imageUrl: null, status: "active" }, arpan.id)).projects).toHaveLength(1);

    const otherPm = await createTestUser(db, { email: "pm2@example.com" });
    const other = await createDivision(db, { name: "Divisi lain" });
    await setDivisionPms(db, other.id, { userIds: [otherPm.id] });
    expect((await getPersonHistory(db, otherPm, arpan.id)).projects).toEqual([]);
    await expect(getPersonProjectHistory(db, otherPm, arpan.id, projectId)).rejects.toBeInstanceOf(NotFoundError);

    const budi = await createTestUser(db, { email: "budi@example.com" });
    await expect(getPersonHistory(db, budi, arpan.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getPersonHistory(db, pm, "00000000-0000-4000-8000-000000000099")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("tanpa jejak → riwayat kosong", async () => {
    expect((await getPersonHistory(db, pm, pm.id)).projects).toEqual([]);
  });
});
