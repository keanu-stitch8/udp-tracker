import { describe, expect, it } from "vitest";
import { projects, transactions, wallets } from "@/db/schema";
import { createTestDb } from "@tests/helpers/test-db";

describe("skema DB", () => {
  it("migrasi jalan dan constraint nominal aktif", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25" }).returning();
    expect(project.pax).toBe(9);
    expect(project.status).toBe("active");
    const [wallet] = await db.insert(wallets).values({ projectId: project.id, kind: "cash", name: "Cash" }).returning();
    await expect(
      db.insert(transactions).values({ projectId: project.id, type: "income", date: "2026-10-20", amount: 0, walletId: wallet.id }),
    ).rejects.toThrow();
  });
});
