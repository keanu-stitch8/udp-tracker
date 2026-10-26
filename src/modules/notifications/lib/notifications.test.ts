import { describe, expect, it } from "vitest";
import type { AttentionItem } from "@/modules/dashboard/lib/attention";
import type { ActivitySnapshot } from "./activity";
import { accessItems, activityItems, badgeLabel, followupItems, groupFromSlug, groupKeysFor, totalCount } from "./notifications";

const view = (id: string, over: Record<string, unknown> = {}) =>
  ({ id, type: "expense", date: "2026-10-22", time: "14:30", amount: 200_000, walletId: "w-cash", categoryId: "c-bensin", categoryName: "Bensin", merchant: null, balanceCheckId: null, attachments: [], ...over }) as never;

describe("grup", () => {
  it("akses hanya untuk Root; slug URL ↔ key", () => {
    expect(groupKeysFor({ isRoot: true })).toEqual(["followup", "activity", "access"]);
    expect(groupKeysFor({ isRoot: false })).toEqual(["followup", "activity"]);
    expect(groupFromSlug("tindak-lanjut")).toBe("followup");
    expect(groupFromSlug("aktivitas")).toBe("activity");
    expect(groupFromSlug("akun")).toBe("access");
    expect(groupFromSlug("ngawur")).toBeNull();
    expect(groupFromSlug(null)).toBeNull();
  });

  it("angka total dan label badge", () => {
    expect(totalCount([{ count: 3 }, { count: 0 }, { count: 2 }])).toBe(5);
    expect(badgeLabel(0)).toBeNull();
    expect(badgeLabel(7)).toBe("7");
    expect(badgeLabel(120)).toBe("99+");
  });
});

describe("followupItems", () => {
  const walletItems: AttentionItem[] = [{ kind: "negative", label: "Cash minus Rp 5.000", href: "/lainnya/dompet/w-cash" }];
  const views = [
    view("t1", { date: "2026-10-21" }),
    view("t2", { walletId: "w-bca", time: "16:00" }),
    view("t3", { attachments: [{}] }),
    view("t4", { type: "income" }),
    view("t5", { categoryId: "c-admin" }),
  ];

  it("Root/PM: semua transaksi tanpa bon (terbaru dulu) lalu item dompet", () => {
    const items = followupItems({ views, adminCategoryId: "c-admin", scope: null, walletItems });
    expect(items.map((i) => [i.text, i.when, i.href])).toEqual([
      ["Bensin Rp 200.000 belum ada bon", "22/10 16:00", "/transaksi/t2"],
      ["Bensin Rp 200.000 belum ada bon", "21/10 14:30", "/transaksi/t1"],
      ["Cash minus Rp 5.000", null, "/lainnya/dompet/w-cash"],
    ]);
  });

  it("anggota: hanya dompet pegangan, tanpa item dompet", () => {
    const items = followupItems({ views, adminCategoryId: "c-admin", scope: ["w-cash"], walletItems });
    expect(items.map((i) => i.href)).toEqual(["/transaksi/t1"]);
  });
});

describe("accessItems", () => {
  it("user menunggu persetujuan, terbaru dulu", () => {
    const items = accessItems([
      { id: "u1", name: "Budi", email: "budi@x.id", createdAt: "2026-10-21T02:00:00.000Z" },
      { id: "u2", name: null, email: "cici@x.id", createdAt: "2026-10-22T03:05:00.000Z" },
    ]);
    expect(items.map((i) => [i.text, i.when, i.href])).toEqual([
      ["cici@x.id menunggu persetujuan", "22/10 10:05", "/lainnya/pengguna"],
      ["Budi (budi@x.id) menunggu persetujuan", "21/10 09:00", "/lainnya/pengguna"],
    ]);
  });
});

describe("activityItems", () => {
  const snap: ActivitySnapshot = { type: "expense", label: "Bensin", amount: 200_000, date: "2026-10-22", time: "14:30", walletName: "Cash", receipts: 0 };
  const row = (id: string, actorId: string, createdAt: string, transaction: { walletId: string; deleted: boolean } | null = { walletId: "w-cash", deleted: false }) => ({
    id,
    kind: "transaction_created" as const,
    actorId,
    actorName: actorId === "u-me" ? "Saya" : "Arpan",
    before: null,
    after: snap,
    createdAt,
    transactionId: transaction ? `tx-${id}` : null,
    transaction,
  });

  it("unread = orang lain setelah seenAt; link hanya bila transaksi masih ada dan dalam cakupan", () => {
    const items = activityItems(
      [
        row("a3", "u-arpan", "2026-10-22T08:00:00.000Z"),
        row("a2", "u-me", "2026-10-22T07:00:00.000Z"),
        row("a1", "u-arpan", "2026-10-21T07:00:00.000Z", { walletId: "w-cash", deleted: true }),
        row("a0", "u-arpan", "2026-10-22T09:00:00.000Z", { walletId: "w-bca", deleted: false }),
      ],
      { viewerId: "u-me", scope: ["w-cash"], seenAt: "2026-10-22T06:00:00.000Z" },
    );
    expect(items.map((i) => [i.id, i.unread, i.href])).toEqual([
      ["a3", true, "/transaksi/tx-a3"],
      ["a2", false, "/transaksi/tx-a2"],
      ["a1", false, null],
      ["a0", true, null],
    ]);
    expect(items[0].text).toBe("Arpan menambahkan Bensin Rp 200.000 untuk 22/10 jam 14:30");
    expect(items[0].when).toBe("22/10 15:00");
    expect(items.filter((i) => i.unread)).toHaveLength(2);
  });

  it("belum pernah dibuka → semua aktivitas orang lain unread", () => {
    expect(activityItems([row("a1", "u-arpan", "2026-10-21T07:00:00.000Z")], { viewerId: "u-me", scope: null, seenAt: null })[0].unread).toBe(true);
  });
});
