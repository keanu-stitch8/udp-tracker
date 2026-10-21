import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { createProject } from "@/modules/projects/commands/create-project";
import { updateProject } from "@/modules/projects/commands/update-project";
import { createTestDb } from "@tests/helpers/test-db";
import { putReceipt } from "./api/blob";
import { GeminiError, generateJson } from "./api/gemini";
import { uploadReceipt } from "./services/upload-receipt";

vi.mock("./api/blob", () => ({
  putReceipt: vi.fn(async (pathname: string) => ({ pathname, url: `https://store.private.blob.vercel-storage.com/${pathname}` })),
  readReceipt: vi.fn(),
  deleteReceipts: vi.fn(),
}));
vi.mock("./api/gemini", async (importOriginal) => ({ ...(await importOriginal<typeof import("./api/gemini")>()), generateJson: vi.fn() }));

const config = { geminiApiKey: "kunci-uji", geminiModels: ["gemini-uji", "gemini-cadangan"] };
const jpeg = (bytes = 10_000) => new File([new Uint8Array(bytes)], "bon.jpg", { type: "image/jpeg" });
let db: Db;
let projectId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  db = await createTestDb();
  projectId = (await createProject(db, { name: "Uji Bon", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
});

describe("uploadReceipt", () => {
  it("menyimpan ke Blob lalu scan dengan kategori pengeluaran proyek", async () => {
    vi.mocked(generateJson).mockResolvedValue({ amount: "Rp 54.000", date: "2026-10-21", time: "14.05", merchant: "Tol Cipularang", categoryHint: "Tol", confident: true });
    const result = await uploadReceipt(db, projectId, jpeg(), config);

    const [pathname, , contentType] = vi.mocked(putReceipt).mock.calls[0];
    expect(pathname).toMatch(new RegExp(`^receipts/${projectId}/[0-9a-f-]{36}\\.jpg$`));
    expect(contentType).toBe("image/jpeg");
    expect(result.attachment).toEqual({ pathname, blobUrl: `https://store.private.blob.vercel-storage.com/${pathname}`, mimeType: "image/jpeg", sizeBytes: 10_000 });
    expect(result.scan).toEqual({ ok: true, scan: { amount: 54_000, date: "2026-10-21", time: "14:05", merchant: "Tol Cipularang", categoryHint: "Tol", confident: true } });

    const { prompt, model, file } = vi.mocked(generateJson).mock.calls[0][0];
    expect(model).toBe("gemini-uji");
    expect(file.mimeType).toBe("image/jpeg");
    expect(prompt).toContain("Tol");
    expect(prompt).not.toContain("UDP Kantor");
    expect(prompt).toContain("2026");
  });

  it("model utama sibuk/kuota/timeout → coba model cadangan", async () => {
    for (const reason of ["busy", "quota", "timeout"] as const) {
      vi.mocked(generateJson).mockReset();
      vi.mocked(generateJson).mockRejectedValueOnce(new GeminiError(reason, "x")).mockResolvedValueOnce({ amount: 10_000, confident: true });
      const result = await uploadReceipt(db, projectId, jpeg(), config);
      expect(result.scan).toMatchObject({ ok: true, scan: { amount: 10_000 } });
      expect(vi.mocked(generateJson).mock.calls.map(([input]) => input.model)).toEqual(["gemini-uji", "gemini-cadangan"]);
    }
  });

  it("semua model gagal → alasan terakhir dikembalikan, lampiran tetap tersimpan; error lain tidak dicoba ulang", async () => {
    vi.mocked(generateJson).mockRejectedValue(new GeminiError("busy", "sibuk"));
    expect((await uploadReceipt(db, projectId, jpeg(), config)).scan).toEqual({ ok: false, reason: "busy" });
    expect(generateJson).toHaveBeenCalledTimes(2);

    vi.mocked(generateJson).mockReset();
    vi.mocked(generateJson).mockRejectedValue(new GeminiError("failed", "400"));
    expect((await uploadReceipt(db, projectId, jpeg(), config)).scan).toEqual({ ok: false, reason: "failed" });
    expect(generateJson).toHaveBeenCalledOnce();
    expect(putReceipt).toHaveBeenCalledTimes(2);
  });

  it("tanpa GEMINI_API_KEY → unconfigured, upload tetap jalan", async () => {
    const result = await uploadReceipt(db, projectId, jpeg(), { ...config, geminiApiKey: null });
    expect(result.scan).toEqual({ ok: false, reason: "unconfigured" });
    expect(generateJson).not.toHaveBeenCalled();
    expect(putReceipt).toHaveBeenCalledOnce();
  });

  it("menolak jenis file lain dan file > 4 MB", async () => {
    const text = new File(["halo"], "a.txt", { type: "text/plain" });
    for (const file of [text, jpeg(4 * 1024 * 1024 + 1)]) {
      const error = await uploadReceipt(db, projectId, file, config).catch((e) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.fieldErrors.file).toHaveLength(1);
    }
    expect(putReceipt).not.toHaveBeenCalled();
  });

  it("proyek selesai atau tidak ada → ditolak", async () => {
    await updateProject(db, projectId, { status: "done" });
    await expect(uploadReceipt(db, projectId, jpeg(), config)).rejects.toThrow(/dikunci/);
    await expect(uploadReceipt(db, crypto.randomUUID(), jpeg(), config)).rejects.toBeInstanceOf(NotFoundError);
    expect(putReceipt).not.toHaveBeenCalled();
  });
});
