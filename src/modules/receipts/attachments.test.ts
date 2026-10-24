import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/types";
import { ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTransaction, createTransactions, updateTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference, getTransactionView, listTransactionViews } from "@/modules/transactions/queries/views";
import { createTestDb, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { deleteReceipts } from "./api/blob";

vi.mock("./api/blob", () => ({ putReceipt: vi.fn(), readReceipt: vi.fn(), deleteReceipts: vi.fn() }));

let db: Db;
let projectId: string;
let base: Record<string, unknown>;

const draft = (project = projectId, ext = "jpg") => {
  const pathname = `receipts/${project}/${crypto.randomUUID()}.${ext}`;
  return { pathname, blobUrl: `https://abc.private.blob.vercel-storage.com/${pathname}`, mimeType: "image/jpeg", sizeBytes: 1234 };
};

beforeEach(async () => {
  vi.clearAllMocks();
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Uji Lampiran", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
  const ref = await getTransactionReference(db, projectId);
  base = { type: "expense", date: "2026-10-21", time: "09:00", amount: 54_000, walletId: ref.wallets[0].id, categoryId: ref.categories.find((c) => c.name === "Tol")!.id };
});

describe("lampiran transaksi", () => {
  it("disimpan bersama transaksi dan tampil di view", async () => {
    const a = draft();
    const saved = await createTransaction(db, projectId, { ...base, attachments: [{ ...a, ocr: { amount: 54_000, date: null, merchant: null, categoryHint: "Tol", confident: true } }] }, null);
    const view = await getTransactionView(db, projectId, saved.id);
    expect(view.attachments).toHaveLength(1);
    expect(view.attachments[0]).toMatchObject({ pathname: a.pathname, mimeType: "image/jpeg", sizeBytes: 1234 });
    expect(view.attachments[0].url).toBe(`/api/projects/${projectId}/attachments/${view.attachments[0].id}`);
  });

  it("ubah: tanpa field attachments → tetap; daftar kosong → dihapus termasuk blob-nya", async () => {
    const a = draft();
    const saved = await createTransaction(db, projectId, { ...base, attachments: [a] }, null);
    await updateTransaction(db, projectId, saved.id, { ...base, amount: 60_000 }, null);
    expect((await getTransactionView(db, projectId, saved.id)).attachments).toHaveLength(1);
    expect(deleteReceipts).not.toHaveBeenCalled();

    const b = draft();
    await updateTransaction(db, projectId, saved.id, { ...base, attachments: [b] }, null);
    const view = await getTransactionView(db, projectId, saved.id);
    expect(view.attachments.map((x) => x.pathname)).toEqual([b.pathname]);
    expect(deleteReceipts).toHaveBeenCalledWith([a.pathname]);

    await updateTransaction(db, projectId, saved.id, { ...base, attachments: [] }, null);
    expect((await getTransactionView(db, projectId, saved.id)).attachments).toEqual([]);
    expect(deleteReceipts).toHaveBeenLastCalledWith([b.pathname]);
  });

  it("satu file untuk banyak transaksi (riwayat tol): file Blob baru dihapus setelah tidak dipakai transaksi mana pun", async () => {
    const shot = draft();
    const [first, second] = await createTransactions(db, projectId, { transactions: [{ ...base, attachments: [shot] }, { ...base, time: "10:00", attachments: [shot] }] }, null);
    await updateTransaction(db, projectId, first.id, { ...base, attachments: [] }, null);
    expect(deleteReceipts).not.toHaveBeenCalled();
    expect((await getTransactionView(db, projectId, second.id)).attachments.map((x) => x.pathname)).toEqual([shot.pathname]);
    await updateTransaction(db, projectId, second.id, { ...base, time: "10:00", attachments: [] }, null);
    expect(deleteReceipts).toHaveBeenCalledWith([shot.pathname]);
  });

  it("menolak lampiran milik proyek lain, host bukan Blob private, dan lebih dari 5", async () => {
    const other = draft(crypto.randomUUID());
    const foreignHost = { ...draft(), blobUrl: "https://contoh.com/receipts/x.jpg" };
    const tooMany = Array.from({ length: 6 }, () => draft());
    for (const attachments of [[other], [foreignHost], tooMany]) {
      const error = await createTransaction(db, projectId, { ...base, attachments }, null).catch((e) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(Object.keys(error.fieldErrors).some((key) => key.startsWith("attachments"))).toBe(true);
    }
  });

  it("daftar transaksi memuat lampiran per transaksi", async () => {
    await createTransaction(db, projectId, { ...base, attachments: [draft(), draft(projectId, "pdf")] }, null);
    await createTransaction(db, projectId, base, null);
    const counts = (await listTransactionViews(db, projectId)).map((v) => v.attachments.length).sort();
    expect(counts).toEqual([0, 2]);
  });
});
