import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { removeMember } from "@/modules/members/commands/members";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTransaction, deleteTransaction, restoreTransaction, updateTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { insertProjectMembers } from "@/modules/users/api/access-repo";
import { rejectUser } from "@/modules/users/commands/manage-users";
import type { CurrentUser } from "@/modules/users/types/user";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { adjustBalanceCheck, createBalanceCheck } from "./commands/balance-check";
import { setWalletHolders } from "./commands/wallet-holders";
import { getWalletList } from "./queries/wallets";
import { walletScope, type LedgerActor } from "./services/wallet-scope";

let db: Db;
let projectId: string;
let cash: string;
let rekening: string;
let tol: string;
let arpan: CurrentUser;
let pm: CurrentUser;

const expense = (walletId: string, amount = 10_000) => ({ type: "expense", date: "2026-10-20", time: "09:00", amount, walletId, categoryId: tol });
const actorOf = async (user: CurrentUser): Promise<LedgerActor> => ({ userId: user.id, scope: await walletScope(db, "member", user.id, projectId) });

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 4, vehicles: [] })).id;
  const reference = await getTransactionReference(db, projectId);
  cash = reference.wallets.find((w) => w.name === "Cash")!.id;
  rekening = reference.wallets.find((w) => w.name === "Rekening")!.id;
  tol = reference.categories.find((c) => c.name === "Tol")!.id;
  pm = await createTestUser(db, { email: "pm@example.com", name: "PM" });
  arpan = await createTestUser(db, { email: "arpan@example.com", name: "Arpan" });
  await insertProjectMembers(db, [{ projectId, userId: arpan.id, addedBy: null }]);
});

describe("pemegang dompet", () => {
  it("hanya anggota proyek; tampil di daftar dompet; Root/PM tanpa batas", async () => {
    const outsider = await createTestUser(db, { email: "luar@example.com" });
    await expect(setWalletHolders(db, pm, projectId, cash, { userIds: [outsider.id] })).rejects.toBeInstanceOf(ValidationError);

    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    const wallets = (await getWalletList(db, projectId)).wallets;
    expect(wallets.find((w) => w.id === cash)!.holders).toEqual([{ id: arpan.id, name: "Arpan" }]);
    expect(wallets.find((w) => w.id === rekening)!.holders).toEqual([]);

    expect(await walletScope(db, "member", arpan.id, projectId)).toEqual([cash]);
    expect(await walletScope(db, "pm", arpan.id, projectId)).toBeNull();
    expect(await walletScope(db, "root", arpan.id, projectId)).toBeNull();
  });

  it("anggota hanya mencatat di dompet pegangan; transfer dicek dari dompet asal", async () => {
    await expect(createTransaction(db, projectId, expense(cash), await actorOf(arpan))).rejects.toBeInstanceOf(ForbiddenError);

    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    const actor = await actorOf(arpan);
    const own = await createTransaction(db, projectId, expense(cash), actor);
    expect(own).toMatchObject({ walletId: cash, createdBy: arpan.id });
    await expect(createTransaction(db, projectId, expense(rekening), actor)).rejects.toBeInstanceOf(ForbiddenError);

    const transfer = { type: "transfer", date: "2026-10-20", time: "09:00", amount: 5_000 };
    expect(await createTransaction(db, projectId, { ...transfer, walletId: cash, toWalletId: rekening }, actor)).toMatchObject({ walletId: cash });
    await expect(createTransaction(db, projectId, { ...transfer, walletId: rekening, toWalletId: cash }, actor)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("ubah/hapus/pulihkan: dompet lama dan baru harus dalam cakupan", async () => {
    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    const actor = await actorOf(arpan);
    const own = await createTransaction(db, projectId, expense(cash), actor);
    const pmOnly = await createTransaction(db, projectId, expense(rekening), null);

    expect((await updateTransaction(db, projectId, own.id, expense(cash, 12_000), actor)).amount).toBe(12_000);
    await expect(updateTransaction(db, projectId, own.id, expense(rekening), actor)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateTransaction(db, projectId, pmOnly.id, expense(cash), actor)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteTransaction(db, projectId, pmOnly.id, actor)).rejects.toBeInstanceOf(ForbiddenError);

    await deleteTransaction(db, projectId, own.id, actor);
    expect(await restoreTransaction(db, projectId, own.id, actor)).toMatchObject({ id: own.id });
    await deleteTransaction(db, projectId, pmOnly.id, null);
    await expect(restoreTransaction(db, projectId, pmOnly.id, actor)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("cek saldo dan catat selisih hanya di dompet pegangan", async () => {
    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    const actor = await actorOf(arpan);
    await expect(createBalanceCheck(db, projectId, rekening, { date: "2026-10-20", actualBalance: 1_000 }, actor)).rejects.toBeInstanceOf(ForbiddenError);
    const check = await createBalanceCheck(db, projectId, cash, { date: "2026-10-20", actualBalance: 1_000 }, actor);
    expect(await adjustBalanceCheck(db, projectId, check.id, {}, actor)).toMatchObject({ walletId: cash, createdBy: arpan.id });

    const pmCheck = await createBalanceCheck(db, projectId, rekening, { date: "2026-10-20", actualBalance: 1_000 }, null);
    await expect(adjustBalanceCheck(db, projectId, pmCheck.id, {}, actor)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("dicabut, dikeluarkan, atau ditolak → hak hilang, riwayat tetap dengan info", async () => {
    const reasonsOf = async (walletId: string) =>
      (await getWalletList(db, projectId)).holderHistory.filter((h) => h.walletId === walletId).map((h) => [h.name, h.assignedByName, h.revokeReason, h.revokedByName]);

    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    await setWalletHolders(db, pm, projectId, cash, { userIds: [] });
    expect(await walletScope(db, "member", arpan.id, projectId)).toEqual([]);
    expect(await reasonsOf(cash)).toEqual([["Arpan", "PM", "revoked", "PM"]]);

    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    await setWalletHolders(db, pm, projectId, cash, { userIds: [arpan.id] });
    await removeMember(db, pm, projectId, arpan.id);
    expect(await walletScope(db, "member", arpan.id, projectId)).toEqual([]);
    expect((await reasonsOf(cash)).map((r) => r[2])).toEqual(["removed", "revoked"]);
    expect((await getWalletList(db, projectId)).wallets.find((w) => w.id === cash)!.holders).toEqual([]);

    await insertProjectMembers(db, [{ projectId, userId: arpan.id, addedBy: null }]);
    await setWalletHolders(db, pm, projectId, rekening, { userIds: [arpan.id] });
    await rejectUser(db, pm, arpan.id);
    expect(await walletScope(db, "member", arpan.id, projectId)).toEqual([]);
    expect((await reasonsOf(rekening)).map((r) => r[2])).toEqual(["rejected"]);
  });
});
