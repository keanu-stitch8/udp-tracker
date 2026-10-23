import { describe, expect, it } from "vitest";
import { recentlyAdded } from "./recent";

const t = (id: string, date: string, createdAt: string) => ({ id, date, time: "09:00", createdAt });

describe("recentlyAdded", () => {
  it("urut waktu input terbaru, bukan tanggal transaksi; dibatasi jumlahnya", () => {
    const items = [
      t("kemarin-diinput-pagi", "2026-10-22", "2026-10-23T01:00:00.000Z"),
      t("hari-ini", "2026-10-23", "2026-10-23T02:00:00.000Z"),
      t("tanggal-lama-baru-diinput", "2026-10-19", "2026-10-23T05:00:00.000Z"),
      t("lama", "2026-10-20", "2026-10-20T03:00:00.000Z"),
    ];
    expect(recentlyAdded(items, 3).map((x) => x.id)).toEqual(["tanggal-lama-baru-diinput", "hari-ini", "kemarin-diinput-pagi"]);
  });
});
