import { describe, expect, it } from "vitest";
import { categories, transactions, tx, wallets } from "@tests/helpers/ledger-fixture";
import type { Attachment } from "@/modules/receipts/types/attachment";
import { toTransactionViews } from "./ledger";
import { isMissingReceipt } from "./receipt";

const attachment = (transactionId: string): Attachment => ({
  id: `a-${transactionId}`,
  transactionId,
  pathname: "receipts/x/y.jpg",
  blobUrl: "https://x.private.blob.vercel-storage.com/receipts/x/y.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1,
  url: "/x",
});

describe("isMissingReceipt", () => {
  it("hanya pengeluaran tanpa lampiran; bukan penyesuaian cek saldo, bukan kategori Biaya Admin", () => {
    const adjustment = tx({ id: "adj", type: "expense", date: "2026-10-21", amount: 5_000, walletId: "cash", categoryId: "makan-siang", balanceCheckId: "c1" });
    const legacyAdmin = tx({ id: "legacy", type: "expense", date: "2026-10-21", amount: 2_500, walletId: "cash", categoryId: "admin" });
    const views = toTransactionViews([...transactions, adjustment, legacyAdmin], { wallets, categories, vehicles: [], attachments: [attachment("siang")] });
    expect(views.filter((v) => isMissingReceipt(v, "admin")).map((v) => v.id)).toEqual(["tol1", "malam"]);
  });
});
