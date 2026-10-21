// ReportGateway dengan googleapis (scope drive.file: hanya file buatan app ini). Setiap panggilan lewat gcall (retry kuota).
import "server-only";
import { Readable } from "node:stream";
import { google, type sheets_v4 } from "googleapis";
import type { Db } from "@/db/types";
import { gcall } from "@/modules/google/lib/gcall";
import { authorizedClient } from "@/modules/google/services/google-oauth";
import { todayWib } from "@/modules/shared/lib/date";
import type { ReportCell, ReportTab } from "../types/report";
import type { ReportGateway } from "../types/gateway";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const quote = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const status = (error: unknown) => (error as { status?: number; response?: { status?: number } })?.status ?? (error as { response?: { status?: number } })?.response?.status;

function cellData(cell: ReportCell | undefined): sheets_v4.Schema$CellData {
  if (!cell || cell.value === null) return {};
  const textFormat: sheets_v4.Schema$TextFormat = {};
  if (cell.bold) textFormat.bold = true;
  if (cell.link) textFormat.link = { uri: cell.link };
  return {
    userEnteredValue: typeof cell.value === "number" ? { numberValue: cell.value } : { stringValue: cell.value },
    userEnteredFormat: {
      ...(Object.keys(textFormat).length ? { textFormat } : {}),
      ...(cell.money ? { numberFormat: { type: "NUMBER", pattern: "#,##0" } } : {}),
    },
  };
}

const columnsOf = (tab: ReportTab) => Math.max(1, ...tab.rows.map((r) => r.length));

export async function googleGateway(db: Db): Promise<ReportGateway> {
  const auth = await authorizedClient(db);
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  const renameFile = async (id: string, name: string) => {
    await gcall(() => drive.files.update({ fileId: id, requestBody: { name } }));
  };

  return {
    async folderExists(id) {
      try {
        const res = await gcall(() => drive.files.get({ fileId: id, fields: "id,trashed" }));
        return !res.data.trashed;
      } catch (error) {
        if (status(error) === 404) return false;
        throw error;
      }
    },

    async findFolder(name, parentId) {
      const res = await gcall(() =>
        drive.files.list({ q: `name = ${quote(name)} and ${quote(parentId)} in parents and mimeType = '${FOLDER_MIME}' and trashed = false`, fields: "files(id)", pageSize: 1 }),
      );
      return res.data.files?.[0]?.id ?? null;
    },

    async createFolder(name, parentId) {
      const res = await gcall(() => drive.files.create({ requestBody: { name, mimeType: FOLDER_MIME, parents: parentId ? [parentId] : undefined }, fields: "id,webViewLink" }));
      return { id: res.data.id!, url: res.data.webViewLink ?? `https://drive.google.com/drive/folders/${res.data.id}` };
    },

    async uploadFile({ name, mimeType, body, parentId }) {
      const res = await gcall(() => drive.files.create({ requestBody: { name, parents: [parentId] }, media: { mimeType, body: Readable.from(body) }, fields: "id,webViewLink" }));
      return { id: res.data.id!, url: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view` };
    },

    async createSpreadsheet(title, folderId, tabs) {
      const created = await gcall(() =>
        sheets.spreadsheets.create({
          requestBody: {
            properties: { title, locale: "in_ID", timeZone: "Asia/Jakarta" },
            sheets: tabs.map((tab, i) => ({
              properties: { sheetId: i, title: tab.title, gridProperties: { rowCount: tab.rows.length + 20, columnCount: columnsOf(tab), frozenRowCount: tab.freezeRows } },
            })),
          },
          fields: "spreadsheetId,spreadsheetUrl",
        }),
      );
      const id = created.data.spreadsheetId!;
      try {
        const requests: sheets_v4.Schema$Request[] = tabs.flatMap((tab, i) => [
          {
            updateCells: {
              start: { sheetId: i, rowIndex: 0, columnIndex: 0 },
              rows: tab.rows.map((row) => ({ values: row.map(cellData) })),
              fields: "userEnteredValue,userEnteredFormat.textFormat,userEnteredFormat.numberFormat",
            },
          },
          { autoResizeDimensions: { dimensions: { sheetId: i, dimension: "COLUMNS", startIndex: 0, endIndex: columnsOf(tab) } } },
        ]);
        await gcall(() => sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests } }));
        const file = await gcall(() => drive.files.get({ fileId: id, fields: "parents" }));
        await gcall(() => drive.files.update({ fileId: id, addParents: folderId, removeParents: (file.data.parents ?? []).join(","), fields: "id" }));
      } catch (error) {
        await renameFile(id, `${title} (GAGAL ${todayWib()})`).catch(() => undefined);
        throw error;
      }
      return { id, url: created.data.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${id}/edit` };
    },

    renameFile,
  };
}
