import { describe, expect, it } from "vitest";
import type { ProjectDetail } from "@/modules/projects/types/project";
import { categories, groups, mealBudget, transactions, tx, wallets } from "@tests/helpers/ledger-fixture";
import type { ReportInput, ReportTab } from "../types/report";
import { buildReport } from "./report";

const project: ProjectDetail = {
  id: "p1",
  name: "Hero Kudus",
  location: "Kudus",
  startDate: "2026-10-20",
  endDate: "2026-10-25",
  pax: 9,
  status: "active",
  sheetUrl: null,
  days: 6,
  vehicles: [{ id: "mobil1", name: "Mobil 1", plate: null }],
};

const input: ReportInput = {
  project,
  wallets,
  categories,
  groups,
  budgets: [mealBudget],
  transactions,
  receipts: [{ transactionId: "siang", driveUrl: "https://drive.google.com/file/d/bon1/view" }],
  exportedAt: new Date("2026-10-21T17:40:00Z"),
};

const values = (tab: ReportTab) => tab.rows.map((row) => row.map((cell) => cell.value));
const tab = (title: string) => buildReport(input).find((t) => t.title === title)!;
const rowOf = (t: ReportTab, first: string) => values(t).find((row) => row[0] === first);

describe("buildReport", () => {
  it("4 tab: Rekap, Detail, Harian, Pagu", () => {
    expect(buildReport(input).map((t) => t.title)).toEqual(["Rekap", "Detail", "Harian", "Pagu"]);
  });

  it("Detail: kronologis, jam, grup, transfer A → B, saldo berjalan gabungan, link bon", () => {
    const detail = tab("Detail");
    expect(detail.freezeRows).toBe(1);
    expect(values(detail)[0]).toEqual(["No", "Tanggal", "Jam", "Jenis", "Grup", "Kategori", "Berita", "Dompet", "Mobil", "Masuk", "Keluar", "Biaya admin", "Saldo berjalan", "Bon 1"]);
    const rows = values(detail).slice(1);
    expect(rows.map((r) => r[12])).toEqual([5_200_000, 5_300_000, 5_293_500, 4_693_500, 3_793_500, 3_743_500]);
    expect(rows[0].slice(0, 10)).toEqual([1, "19 Okt 2026", "09:00", "Masuk", "-", "udp", null, "rekening", null, 5_000_000]);
    expect(rows[2].slice(3, 12)).toEqual(["Transfer", "-", "Transfer", null, "rekening → cash", null, null, null, 6_500]);
    expect(rows[3].slice(4, 6)).toEqual(["Meal", "makan-siang"]);
    expect(rows[5][8]).toBe("Mobil 1");
    expect(detail.rows[4][13]).toEqual({ value: "Bon 1", link: "https://drive.google.com/file/d/bon1/view" });
    expect(detail.rows[1][9]).toMatchObject({ money: true });
  });

  it("Detail: pengeluaran dengan biaya admin → Keluar + Biaya admin, saldo berjalan kurangi keduanya", () => {
    const fee = tx({ type: "expense", date: "2026-10-22", amount: 16_500, adminFee: 2_000, walletId: "rekening", categoryId: "makan-siang" });
    const detail = buildReport({ ...input, transactions: [...transactions, fee] }).find((t) => t.title === "Detail")!;
    expect(values(detail).at(-1)!.slice(10, 13)).toEqual([16_500, 2_000, 3_743_500 - 18_500]);
  });

  it("Harian: kolom kategori pengeluaran yang terpakai, urut per grup, + total", () => {
    const daily = values(tab("Harian"));
    expect(daily[0]).toEqual(["Tanggal", "makan-malam", "makan-siang", "tol", "admin", "Total"]);
    expect(daily[1]).toEqual(["19 Okt 2026", null, null, null, 6_500, 6_500]);
    expect(daily.at(-1)).toEqual(["Total", 900_000, 600_000, 50_000, 6_500, 1_556_500]);
  });

  it("Pagu: rumus, nilai, realisasi, sisa, lebih pagu, total, rincian harian", () => {
    const budget = tab("Pagu");
    expect(values(budget)[0]).toEqual(["Pagu", "Rumus", "Nilai pagu", "Realisasi", "Sisa", "Lebih pagu"]);
    expect(rowOf(budget, "Pagu Makan")).toEqual(["Pagu Makan", "Rp 150.000 × 9 orang × 6 hari", 8_100_000, 1_500_000, 6_600_000, 0]);
    expect(rowOf(budget, "Total pagu")).toEqual(["Total pagu", null, 8_100_000, 1_500_000, 6_600_000, 0]);
    expect(rowOf(budget, "20 Okt 2026")).toEqual(["20 Okt 2026", 1_350_000, 1_500_000, -150_000]);
  });

  it("Rekap: info proyek, UDP masuk, pengeluaran per grup (subtotal + kategori), saldo dompet, sisa", () => {
    const recap = tab("Rekap");
    const rows = values(recap);
    const start = rows.findIndex((row) => row[0] === "Pengeluaran per grup");
    expect(rows.slice(start + 1, start + 9)).toEqual([
      ["Grup / kategori", "Total"],
      ["Meal", 1_500_000],
      ["  makan-malam", 900_000],
      ["  makan-siang", 600_000],
      ["Transportation", 50_000],
      ["  tol", 50_000],
      ["Lain-lain", 6_500],
      ["  admin", 6_500],
    ]);
    expect(recap.rows[start + 2][0]).toMatchObject({ bold: true });
    expect(rowOf(recap, "Proyek")).toEqual(["Proyek", "Hero Kudus"]);
    expect(rowOf(recap, "Periode")).toEqual(["Periode", "20 Okt 2026 – 25 Okt 2026"]);
    expect(rowOf(recap, "Diekspor")).toEqual(["Diekspor", "22 Okt 2026 00:40"]);
    expect(rowOf(recap, "Total UDP masuk")).toEqual(["Total UDP masuk", null, null, 5_000_000]);
    expect(rowOf(recap, "Total pengeluaran")).toEqual(["Total pengeluaran", 1_556_500]);
    expect(rowOf(recap, "cash")).toEqual(["cash", -400_000]);
    expect(rowOf(recap, "Sisa (dikembalikan ke kantor)")).toEqual(["Sisa (dikembalikan ke kantor)", 3_743_500]);
  });
});
