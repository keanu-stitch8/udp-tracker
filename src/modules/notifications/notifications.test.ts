import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/types";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTransaction, createTransactions, deleteTransaction, restoreTransaction, updateTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import type { CurrentUser } from "@/modules/users/types/user";
import { createTestDb, createTestUser, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { selectActivities } from "./api/activities-repo";
import { markSeen } from "./commands/mark-seen";
import { getNotifications } from "./queries/notifications";

let db: Db;
let projectId: string;
let pm: CurrentUser;
let member: CurrentUser;
let root: CurrentUser;
let ref: { wallet: (name: string) => string; category: (name: string) => string };

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 9, vehicles: ["Mobil 1"] })).id;
  const reference = await getTransactionReference(db, projectId);
  const find = <T extends { id: string; name: string }>(list: T[]) => (name: string) => list.find((x) => x.name === name)!.id;
  ref = { wallet: find(reference.wallets), category: find(reference.categories) };
  pm = await createTestUser(db, { email: "pm@example.test", name: "Pipit" });
  member = await createTestUser(db, { email: "arpan@example.test", name: "Arpan" });
  root = await createTestUser(db, { email: "root@example.test", name: "Riski", isRoot: true });
});

const expense = (over: Record<string, unknown> = {}) => ({ type: "expense", date: "2026-10-22", time: "14:30", amount: 200_000, walletId: ref.wallet("Cash"), categoryId: ref.category("Bensin Harian"), ...over });
const as = (user: CurrentUser, scope: string[] | null = null) => ({ userId: user.id, scope });
const kinds = async () => (await selectActivities(db, projectId, { limit: 50 })).map((a) => a.kind).reverse();

describe("rekam aktivitas transaksi", () => {
  it("tambah, ubah, hapus, pulihkan masing-masing satu aktivitas dengan snapshot", async () => {
    const tx = await createTransaction(db, projectId, expense(), as(member, [ref.wallet("Cash")]));
    await updateTransaction(db, projectId, tx.id, expense({ amount: 250_000 }), as(member, [ref.wallet("Cash")]));
    await deleteTransaction(db, projectId, tx.id, as(pm));
    await restoreTransaction(db, projectId, tx.id, as(pm));
    expect(await kinds()).toEqual(["transaction_created", "transaction_updated", "transaction_deleted", "transaction_restored"]);
    const [restored, , updated, created] = await selectActivities(db, projectId, { limit: 50 });
    expect(created.after).toMatchObject({ label: "Bensin Harian", amount: 200_000, date: "2026-10-22", time: "14:30", walletName: "Cash", receipts: 0 });
    expect(created.actorId).toBe(member.id);
    expect(updated.before).toMatchObject({ amount: 200_000 });
    expect(updated.after).toMatchObject({ amount: 250_000 });
    expect(restored.actorId).toBe(pm.id);
  });

  it("batch: satu aktivitas per transaksi; gagal validasi → tidak ada aktivitas", async () => {
    await createTransactions(db, projectId, { transactions: [expense(), expense({ amount: 10_000 })] }, as(member));
    expect(await kinds()).toEqual(["transaction_created", "transaction_created"]);
    await expect(createTransactions(db, projectId, { transactions: [expense(), expense({ amount: 0 })] }, as(member))).rejects.toThrow();
    expect(await kinds()).toHaveLength(2);
  });

  it("bon ditambahkan tercatat di snapshot", async () => {
    const tx = await createTransaction(db, projectId, expense(), as(member));
    const pathname = `receipts/${projectId}/${crypto.randomUUID()}.jpg`;
    await updateTransaction(db, projectId, tx.id, expense({ attachments: [{ pathname, blobUrl: `https://abc.private.blob.vercel-storage.com/${pathname}`, mimeType: "image/jpeg", sizeBytes: 1234 }] }), as(member));
    const [updated] = await selectActivities(db, projectId, { limit: 1 });
    expect([updated.before, updated.after].map((s) => (s as { receipts: number }).receipts)).toEqual([0, 1]);
  });
});

describe("getNotifications", () => {
  const viewerOf = (user: CurrentUser, role: "root" | "pm" | "member", scope: string[] | null) => ({ projectId, user, role, scope });

  it("anggota: tindak lanjut di dompet pegangan + aktivitas sendiri tanpa angka", async () => {
    await createTransaction(db, projectId, expense(), as(member, [ref.wallet("Cash")]));
    await createTransaction(db, projectId, expense({ walletId: ref.wallet("Rekening"), categoryId: ref.category("Parkir Harian"), amount: 10_000 }), as(pm));
    const { groups } = await getNotifications(db, viewerOf(member, "member", [ref.wallet("Cash")]), { limit: 5 });
    expect(groups.map((g) => g.key)).toEqual(["followup", "activity"]);
    const [followup, activity] = groups;
    expect(followup.items.map((i) => i.text)).toEqual(["Bensin Harian Rp 200.000 belum ada bon"]);
    expect(followup.count).toBe(1);
    expect(activity.items.map((i) => i.text)).toEqual(["Anda menambahkan Bensin Harian Rp 200.000 untuk 22/10 jam 14:30"]);
    expect(activity.count).toBe(0);
  });

  it("PM: semua aktivitas, unread aktivitas orang lain, terbaca setelah markSeen", async () => {
    await createTransaction(db, projectId, expense(), as(member));
    await createTransaction(db, projectId, expense({ amount: 10_000 }), as(pm));
    let activity = (await getNotifications(db, viewerOf(pm, "pm", null), { limit: 5 })).groups[1];
    expect(activity.items.map((i) => [i.text, i.unread])).toEqual([
      ["Anda menambahkan Bensin Harian Rp 10.000 untuk 22/10 jam 14:30", false],
      ["Arpan menambahkan Bensin Harian Rp 200.000 untuk 22/10 jam 14:30", true],
    ]);
    expect(activity.count).toBe(1);
    await markSeen(db, { userId: pm.id, projectId }, { group: "activity" });
    activity = (await getNotifications(db, viewerOf(pm, "pm", null), { limit: 5 })).groups[1];
    expect(activity.count).toBe(0);
    expect(activity.items.every((i) => !i.unread)).toBe(true);
    // Unread per orang: Root belum membuka.
    expect((await getNotifications(db, viewerOf(root, "root", null), { limit: 5 })).groups[1].count).toBe(2);
  });

  it("Root: grup akun & akses berisi user menunggu persetujuan; limit dan filter grup", async () => {
    await createTestUser(db, { email: "baru@example.test", name: "Budi", status: "pending" });
    for (const amount of [1, 2, 3]) await createTransaction(db, projectId, expense({ amount: amount * 1_000 }), as(pm));
    const { groups } = await getNotifications(db, viewerOf(root, "root", null), { limit: 2 });
    expect(groups.map((g) => [g.key, g.count, g.items.length])).toEqual([
      ["followup", 4, 2], // 3 tanpa bon + Cash minus
      ["activity", 3, 2],
      ["access", 1, 1],
    ]);
    expect(groups[2].items[0].text).toBe("Budi (baru@example.test) menunggu persetujuan");
    const only = await getNotifications(db, viewerOf(root, "root", null), { group: "access", limit: 5 });
    expect(only.groups.map((g) => g.key)).toEqual(["access"]);
    // Bukan Root → grup akses tidak ada walau diminta.
    expect((await getNotifications(db, viewerOf(pm, "pm", null), { group: "access", limit: 5 })).groups).toEqual([]);
  });

  it("markSeen menolak grup tak dikenal", async () => {
    await expect(markSeen(db, { userId: pm.id, projectId }, { group: "ngawur" })).rejects.toThrow();
  });
});
