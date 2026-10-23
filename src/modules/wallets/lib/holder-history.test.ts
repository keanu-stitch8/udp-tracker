import { describe, expect, it } from "vitest";
import type { WalletHolderRecord } from "../types/wallet-holder";
import { describeActiveHolder, describeRevokedHolder } from "./holder-history";

const record = (values: Partial<WalletHolderRecord>): WalletHolderRecord => ({
  id: "h1",
  walletId: "cash",
  userId: "u1",
  name: "Budi",
  assignedAt: "2026-10-19T18:00:00.000Z",
  assignedByName: "Riski",
  revokedAt: null,
  revokedByName: null,
  revokeReason: null,
  ...values,
});

describe("riwayat pegangan", () => {
  it("aktif: sejak tanggal WIB, oleh penugas", () => {
    expect(describeActiveHolder(record({}))).toBe("Sejak 20 Okt 2026, oleh Riski");
    expect(describeActiveHolder(record({ assignedByName: null }))).toBe("Sejak 20 Okt 2026");
  });

  it("berakhir: periode, alasan, pencabut", () => {
    expect(describeRevokedHolder(record({ revokedAt: "2026-10-22T03:00:00.000Z", revokedByName: "Riski", revokeReason: "removed" }))).toBe(
      "20 Okt 2026 – 22 Okt 2026 · dikeluarkan dari proyek oleh Riski",
    );
  });
});
