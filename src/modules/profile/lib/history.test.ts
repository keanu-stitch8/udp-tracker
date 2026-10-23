import { describe, expect, it } from "vitest";
import type { WalletHolderRecord } from "@/modules/wallets/types/wallet-holder";
import { categories, transactions, wallets } from "@tests/helpers/ledger-fixture";
import { heldWallets, inputByCategory, inputSummary, walletFlows } from "./history";

const mine = new Set(["refund", "siang", "malam"]);
const ledger = transactions.map((t) => (mine.has(t.id) ? { ...t, createdBy: "arpan" } : t));
const period = (walletId: string, userId: string, revokedAt: string | null = null): WalletHolderRecord => ({
  id: `${walletId}-${userId}`,
  walletId,
  userId,
  name: userId,
  assignedAt: "2026-10-19T01:00:00.000Z",
  assignedByName: "Riski",
  revokedAt,
  revokedByName: revokedAt ? "Riski" : null,
  revokeReason: revokedAt ? "removed" : null,
});

describe("riwayat orang per proyek", () => {
  it("arus dompet konsisten dengan saldo: transfer masuk, keluar + biaya admin", () => {
    expect(walletFlows("cash", ledger)).toEqual({ moneyIn: 1_100_000, moneyOut: 1_500_000 });
    expect(walletFlows("rekening", ledger)).toEqual({ moneyIn: 5_000_000, moneyOut: 1_006_500 });
  });

  it("hanya dompet yang pernah dia pegang, termasuk yang dicabut", () => {
    const holderHistory = [period("cash", "arpan", "2026-10-22T01:00:00.000Z"), period("rekening", "budi")];
    const held = heldWallets("arpan", { wallets, transactions: ledger, holderHistory, lastCheckDifference: new Map([["cash", -5_000]]) });
    expect(held).toEqual([
      expect.objectContaining({ walletId: "cash", openingBalance: 0, moneyIn: 1_100_000, moneyOut: 1_500_000, balance: -400_000, lastCheckDifference: -5_000 }),
    ]);
    expect(held[0].periods.map((p) => p.revokeReason)).toEqual(["removed"]);
  });

  it("yang dia input: jumlah, masuk, keluar, per kategori", () => {
    expect(inputSummary("arpan", ledger, categories)).toEqual({ count: 3, income: 100_000, expense: 1_500_000 });
    expect(inputByCategory("arpan", ledger, categories)).toEqual([
      { categoryId: "makan-malam", name: "makan-malam", amount: 900_000 },
      { categoryId: "makan-siang", name: "makan-siang", amount: 600_000 },
    ]);
    expect(inputSummary("budi", ledger, categories)).toEqual({ count: 0, income: 0, expense: 0 });
  });
});
