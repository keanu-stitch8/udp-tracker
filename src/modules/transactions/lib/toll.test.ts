import { describe, expect, it } from "vitest";
import { tx } from "@tests/helpers/ledger-fixture";
import { recordedTollKeys, tollKey } from "./toll";

describe("tap tol yang sudah tercatat", () => {
  it("pengeluaran di dompet yang sama dengan tanggal + jam + nominal sama", () => {
    const keys = recordedTollKeys(
      [
        tx({ type: "expense", date: "2026-10-16", time: "17:33", amount: 467_500, walletId: "etoll" }),
        tx({ type: "expense", date: "2026-10-16", time: "09:55", amount: 19_000, walletId: "cash" }),
        tx({ type: "transfer", date: "2026-10-15", time: "16:45", amount: 100_000, walletId: "cash", toWalletId: "etoll" }),
      ],
      "etoll",
    );
    expect(keys.has(tollKey({ date: "2026-10-16", time: "17:33", amount: 467_500 }))).toBe(true);
    expect(keys.has(tollKey({ date: "2026-10-16", time: "17:33", amount: 467_000 }))).toBe(false);
    expect(keys.has(tollKey({ date: "2026-10-16", time: "09:55", amount: 19_000 }))).toBe(false);
    expect(keys.size).toBe(1);
  });
});
