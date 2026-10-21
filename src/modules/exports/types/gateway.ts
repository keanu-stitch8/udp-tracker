import type { ReportTab } from "./report";

export interface DriveFile {
  id: string;
  url: string;
}

/** Akses Google Drive/Sheets yang dibutuhkan ekspor; diimplementasi googleapis, dipalsukan di tes. */
export interface ReportGateway {
  folderExists(id: string): Promise<boolean>;
  findFolder(name: string, parentId: string): Promise<string | null>;
  createFolder(name: string, parentId?: string): Promise<DriveFile>;
  uploadFile(input: { name: string; mimeType: string; body: Buffer; parentId: string }): Promise<DriveFile>;
  /** Buat spreadsheet di folder + tulis semua tab. Gagal setelah dibuat → file diberi akhiran "(GAGAL …)" lalu error dilempar. */
  createSpreadsheet(title: string, folderId: string, tabs: ReportTab[]): Promise<DriveFile>;
  renameFile(id: string, name: string): Promise<void>;
}

export interface ExportResult {
  sheetUrl: string;
  folderUrl: string;
  /** Jumlah foto bon yang baru diunggah ke Drive pada ekspor ini. */
  uploaded: number;
}
