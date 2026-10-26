import { describe, expect, it } from "vitest";
import { activityChanges, activityText, snapshotOf, type ActivitySnapshot } from "./activity";

const refs = {
  wallets: [
    { id: "w-cash", name: "Cash" },
    { id: "w-bca", name: "BCA" },
  ],
  categories: [{ id: "c-bensin", name: "Bensin" }],
};

const base: ActivitySnapshot = { type: "expense", label: "Bensin", amount: 200_000, date: "2026-10-22", time: "14:30", walletName: "Cash", receipts: 0 };

describe("snapshotOf", () => {
  it("label = kategori, lalu merchant, lalu 'Transaksi'; transfer = dompet asal → tujuan", () => {
    const tx = { type: "expense" as const, amount: 200_000, date: "2026-10-22", time: "14:30", categoryId: "c-bensin", walletId: "w-cash", toWalletId: null, merchant: "Pertamina" };
    expect(snapshotOf(tx, refs, 1)).toEqual({ ...base, receipts: 1 });
    expect(snapshotOf({ ...tx, categoryId: null }, refs, 0).label).toBe("Pertamina");
    expect(snapshotOf({ ...tx, categoryId: null, merchant: null }, refs, 0).label).toBe("Transaksi");
    expect(snapshotOf({ ...tx, type: "transfer", categoryId: null, toWalletId: "w-bca" }, refs, 0).label).toBe("Cash → BCA");
  });
});

describe("activityChanges", () => {
  it("mencatat field penting yang berubah, urut label, nominal, tanggal, jam, dompet, bon", () => {
    const after = { ...base, label: "Parkir", amount: 15_000, date: "2026-10-23", time: "15:00", walletName: "BCA", receipts: 1 };
    expect(activityChanges({ ...base, amount: 10_000 }, after)).toEqual([
      "kategori Bensin → Parkir",
      "nominal Rp 10.000 → Rp 15.000",
      "tanggal 22/10 → 23/10",
      "jam 14:30 → 15:00",
      "dompet Cash → BCA",
      "bon ditambahkan",
    ]);
    expect(activityChanges({ ...base, receipts: 2 }, base)).toEqual(["bon dihapus"]);
    expect(activityChanges(base, base)).toEqual([]);
  });
});

describe("activityText", () => {
  const record = (kind: Parameters<typeof activityText>[0]["kind"], before: ActivitySnapshot | null, after: ActivitySnapshot | null, actorId: string | null = "u-arpan") => ({
    kind,
    actorId,
    actorName: actorId ? "Arpan" : null,
    before,
    after,
  });

  it("pelaku = Anda bila yang melihat, nama orang lain, atau Sistem", () => {
    expect(activityText(record("transaction_created", null, base), "u-arpan")).toBe("Anda menambahkan Bensin Rp 200.000 untuk 22/10 jam 14:30");
    expect(activityText(record("transaction_created", null, base), "u-root")).toBe("Arpan menambahkan Bensin Rp 200.000 untuk 22/10 jam 14:30");
    expect(activityText(record("transaction_created", null, base, null), "u-root")).toBe("Sistem menambahkan Bensin Rp 200.000 untuk 22/10 jam 14:30");
  });

  it("ubah menyebut perubahan, atau ringkasan bila field penting sama", () => {
    expect(activityText(record("transaction_updated", { ...base, amount: 150_000 }, base), "u-arpan")).toBe("Anda mengubah Bensin: nominal Rp 150.000 → Rp 200.000");
    expect(activityText(record("transaction_updated", base, base), "u-arpan")).toBe("Anda mengubah Bensin Rp 200.000 (22/10 14:30)");
  });

  it("hapus dan pulihkan", () => {
    expect(activityText(record("transaction_deleted", base, null), "u-root")).toBe("Arpan menghapus Bensin Rp 200.000 (22/10 14:30)");
    expect(activityText(record("transaction_restored", base, null), "u-root")).toBe("Arpan memulihkan Bensin Rp 200.000 (22/10 14:30)");
  });
});
