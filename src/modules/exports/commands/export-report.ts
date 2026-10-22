// Ekspor laporan ke Google Sheets + foto bon ke Drive (spec §6.2 + addendum 2026-10-22).
import "server-only";
import type { Db } from "@/db/types";
import { selectProjectAttachments } from "@/modules/receipts/api/attachments-repo";
import { RECEIPT_MIMES, type ReceiptMime } from "@/modules/receipts/types/receipt";
import { todayWib } from "@/modules/shared/lib/date";
import { compareNewestFirst } from "@/modules/transactions/lib/ledger";
import { getLedger } from "@/modules/transactions/queries/ledger";
import { clearProjectAttachmentsDrive, selectProjectExport, updateAttachmentDrive, updateProjectExport } from "../api/export-repo";
import { readReceiptBuffer } from "../api/receipt-buffer";
import { buildReport } from "../lib/report";
import { receiptFileName } from "../lib/receipt-name";
import type { ExportResult, ReportGateway } from "../types/gateway";

interface ExportDeps {
  gateway: ReportGateway;
  readFile?: (pathname: string) => Promise<Buffer | null>;
  now?: Date;
}

const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;

export async function exportReport(db: Db, projectId: string, { gateway, readFile = readReceiptBuffer, now = new Date() }: ExportDeps): Promise<ExportResult> {
  const ledger = await getLedger(db, projectId);
  const saved = await selectProjectExport(db, projectId);
  const today = todayWib(now);

  // 1. Folder proyek + subfolder Bon (folder lama hilang → buat ulang, foto diunggah lagi).
  let folderId = saved.driveFolderId;
  if (!folderId || !(await gateway.folderExists(folderId))) {
    if (folderId) await clearProjectAttachmentsDrive(db, projectId);
    folderId = (await gateway.createFolder(`UDP – ${saved.name}`)).id;
    await updateProjectExport(db, projectId, { driveFolderId: folderId });
  }
  const bonFolderId = (await gateway.findFolder("Bon", folderId)) ?? (await gateway.createFolder("Bon", folderId)).id;

  // 2. Foto bon yang belum di Drive. No urut = nomor baris transaksi di tab Detail (kronologis).
  const chronological = [...ledger.transactions].sort((a, b) => compareNewestFirst(b, a));
  const seqOf = new Map(chronological.map((t, i) => [t.id, i + 1]));
  const transactionOf = new Map(ledger.transactions.map((t) => [t.id, t]));
  const categoryName = new Map(ledger.categories.map((c) => [c.id, c.name]));
  const rows = (await selectProjectAttachments(db, projectId)).filter((a) => transactionOf.has(a.transactionId));
  const driveUrls = new Map(rows.map((a) => [a.id, a.driveUrl]));
  let uploaded = 0;
  for (const a of rows) {
    if (a.driveFileId) continue;
    const body = await readFile(a.blobPathname);
    if (!body) continue; // file Blob hilang: laporan tetap jadi, sel bon tanpa link
    const t = transactionOf.get(a.transactionId)!;
    const mimeType: ReceiptMime = (RECEIPT_MIMES as readonly string[]).includes(a.mimeType) ? (a.mimeType as ReceiptMime) : "image/jpeg";
    const name = receiptFileName({ date: t.date, seq: seqOf.get(t.id)!, category: t.categoryId ? (categoryName.get(t.categoryId) ?? null) : null, amount: t.amount, mimeType });
    const file = await gateway.uploadFile({ name, mimeType, body, parentId: bonFolderId });
    await updateAttachmentDrive(db, a.id, { driveFileId: file.id, driveUrl: file.url });
    driveUrls.set(a.id, file.url);
    uploaded++;
  }

  // 3–4. Spreadsheet baru berisi 4 tab.
  const tabs = buildReport({
    project: ledger.project,
    wallets: ledger.wallets,
    categories: ledger.categories,
    groups: ledger.groups,
    budgets: ledger.budgets,
    transactions: ledger.transactions,
    receipts: rows.map((a) => ({ transactionId: a.transactionId, driveUrl: driveUrls.get(a.id) ?? null })),
    exportedAt: now,
  });
  const sheet = await gateway.createSpreadsheet(`UDP – ${saved.name} – ${today}`, folderId, tabs);

  // 5–6. Sheet lama ditandai setelah yang baru jadi; lalu simpan yang baru.
  if (saved.sheetId && saved.sheetId !== sheet.id) {
    await gateway.renameFile(saved.sheetId, `UDP – ${saved.name} (lama ${today})`).catch((error) => console.error("[ekspor] gagal rename sheet lama", error));
  }
  await updateProjectExport(db, projectId, { sheetId: sheet.id, sheetUrl: sheet.url });
  return { sheetUrl: sheet.url, folderUrl: folderUrl(folderId), uploaded };
}
