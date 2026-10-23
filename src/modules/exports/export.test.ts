import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachments, projects } from "@/db/schema";
import type { Db } from "@/db/types";
import { createProject } from "@/modules/projects/commands/create-project";
import { createTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { createTestDb, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { exportReport } from "./commands/export-report";
import type { ReportTab } from "./types/report";
import type { ReportGateway } from "./types/gateway";

vi.mock("@/modules/receipts/api/blob", () => ({ putReceipt: vi.fn(), readReceipt: vi.fn(), deleteReceipts: vi.fn() }));

class FakeGateway implements ReportGateway {
  folders = new Map<string, { name: string; parentId?: string }>();
  uploads: string[] = [];
  sheets: { id: string; title: string; tabs: ReportTab[] }[] = [];
  renamed: [string, string][] = [];
  failSheet = false;
  private seq = 0;
  private next = (prefix: string) => `${prefix}${++this.seq}`;
  async folderExists(id: string) {
    return this.folders.has(id);
  }
  async findFolder(name: string, parentId: string) {
    return [...this.folders].find(([, f]) => f.name === name && f.parentId === parentId)?.[0] ?? null;
  }
  async createFolder(name: string, parentId?: string) {
    const id = this.next("folder");
    this.folders.set(id, { name, parentId });
    return { id, url: `https://drive/${id}` };
  }
  async uploadFile({ name }: { name: string }) {
    this.uploads.push(name);
    const id = this.next("file");
    return { id, url: `https://drive/file/${id}` };
  }
  async createSpreadsheet(title: string, _folderId: string, tabs: ReportTab[]) {
    if (this.failSheet) throw new Error("Sheets API down");
    const id = this.next("sheet");
    this.sheets.push({ id, title, tabs });
    return { id, url: `https://sheets/${id}` };
  }
  async renameFile(id: string, name: string) {
    this.renamed.push([id, name]);
  }
}

let db: Db;
let projectId: string;
const readFile = vi.fn(async () => Buffer.from("jpeg"));
const now = new Date("2026-10-22T03:00:00Z");

beforeEach(async () => {
  readFile.mockClear();
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
  const ref = await getTransactionReference(db, projectId);
  const pathname = `receipts/${projectId}/${crypto.randomUUID()}.jpg`;
  await createTransaction(db, projectId, {
    type: "expense",
    date: "2026-10-21",
    time: "12:30",
    amount: 54_000,
    walletId: ref.wallets[0].id,
    categoryId: ref.categories.find((c) => c.name === "Tol")!.id,
    attachments: [{ pathname, blobUrl: `https://abc.private.blob.vercel-storage.com/${pathname}`, mimeType: "image/jpeg", sizeBytes: 10, ocr: null }],
  });
});

describe("exportReport", () => {
  it("ekspor pertama: folder proyek + Bon, foto diunggah dengan nama baku, sheet tersimpan", async () => {
    const gateway = new FakeGateway();
    const result = await exportReport(db, projectId, { gateway, readFile, now });
    expect([...gateway.folders.values()].map((f) => f.name)).toEqual(["UDP – Hero Kudus", "Bon"]);
    expect(gateway.uploads).toEqual(["2026-10-21_001_Tol_54000.jpg"]);
    expect(gateway.sheets[0].title).toBe("UDP – Hero Kudus – 2026-10-22");
    expect(gateway.sheets[0].tabs.map((t) => t.title)).toEqual(["Rekap", "Detail", "Harian", "Pagu"]);
    expect(gateway.sheets[0].tabs[1].rows[1].at(-1)).toMatchObject({ value: "Bon 1", link: expect.stringContaining("https://drive/file/") });
    expect(result).toMatchObject({ sheetUrl: `https://sheets/${gateway.sheets[0].id}`, uploaded: 1 });
    const [project] = await db.select().from(projects);
    expect(project).toMatchObject({ sheetId: gateway.sheets[0].id, sheetUrl: result.sheetUrl });
    const [attachment] = await db.select().from(attachments);
    expect(attachment.driveFileId).toBeTruthy();
  });

  it("ekspor ulang: foto tidak diunggah lagi, folder dipakai ulang, sheet lama di-rename (lama …)", async () => {
    const gateway = new FakeGateway();
    await exportReport(db, projectId, { gateway, readFile, now });
    const first = gateway.sheets[0].id;
    const result = await exportReport(db, projectId, { gateway, readFile, now });
    expect(gateway.uploads).toHaveLength(1);
    expect(gateway.folders.size).toBe(2);
    expect(gateway.renamed).toEqual([[first, "UDP – Hero Kudus (lama 2026-10-22)"]]);
    expect(result.uploaded).toBe(0);
  });

  it("folder lama hilang → dibuat ulang dan foto diunggah lagi", async () => {
    const gateway = new FakeGateway();
    await exportReport(db, projectId, { gateway, readFile, now });
    gateway.folders.clear();
    await exportReport(db, projectId, { gateway, readFile, now });
    expect(gateway.uploads).toHaveLength(2);
  });

  it("pembuatan sheet gagal → error dilempar, sheet lama tidak di-rename", async () => {
    const gateway = new FakeGateway();
    await exportReport(db, projectId, { gateway, readFile, now });
    gateway.failSheet = true;
    await expect(exportReport(db, projectId, { gateway, readFile, now })).rejects.toThrow("Sheets API down");
    expect(gateway.renamed).toEqual([]);
  });
});
