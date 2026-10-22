import { describe, expect, it } from "vitest";
import type { WalletBalance } from "@/modules/wallets/types/wallet";
import { attentionItems } from "./attention";

const wallet = (id: string, kind: WalletBalance["kind"], balance: number): WalletBalance => ({
  id,
  kind,
  name: id.toUpperCase(),
  holder: null,
  vehicleId: null,
  openingBalance: 0,
  archived: false,
  balance,
});

describe("attentionItems", () => {
  it("urutan: bon, selisih, minus, reimburse", () => {
    const items = attentionItems({
      missingReceipts: 4,
      wallets: [wallet("kas", "cash", -15_000), wallet("bank", "bank", 100_000), wallet("talangan", "reimburse", -50_000)],
      latestChecks: [
        { walletId: "bank", difference: -20_000, adjusted: false },
        { walletId: "kas", difference: 5_000, adjusted: true },
      ],
    });
    expect(items).toEqual([
      { kind: "receipt", label: "4 pengeluaran belum ada bon", href: "/transaksi?bon=belum" },
      { kind: "difference", label: "BANK: selisih kurang Rp 20.000 belum dicatat", href: "/lainnya/dompet/bank" },
      { kind: "negative", label: "KAS minus Rp 15.000", href: "/lainnya/dompet/kas" },
      { kind: "reimburse", label: "TALANGAN: Belum diganti Rp 50.000", href: "/lainnya/dompet/talangan" },
    ]);
  });
  it("semua beres → kosong; cek saldo dompet yang tidak aktif diabaikan", () => {
    expect(
      attentionItems({
        missingReceipts: 0,
        wallets: [wallet("kas", "cash", 0), wallet("talangan", "reimburse", 0)],
        latestChecks: [{ walletId: "arsip", difference: -1_000, adjusted: false }],
      }),
    ).toEqual([]);
  });
});
