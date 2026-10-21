import { sql } from "drizzle-orm";
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
      db.insert(transactions).values({ projectId: project.id, type: "income", date: "2026-10-20", time: "09:00", amount: 0, walletId: wallet.id }),
    ).rejects.toThrow();
  });

  it("kolom time wajib; backfill WIB dari created_at", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25" }).returning();
    const [wallet] = await db.insert(wallets).values({ projectId: project.id, kind: "cash", name: "Cash" }).returning();
    await expect(
      db.execute(sql`insert into transactions (project_id, type, date, amount, wallet_id) values (${project.id}, 'income', '2026-10-20', 1000, ${wallet.id})`),
    ).rejects.toThrow();
    const result = (await db.execute(sql`select date_trunc('minute', timestamptz '2026-10-21T02:15:40Z' at time zone 'Asia/Jakarta')::time as t`)) as { rows: unknown[] };
    expect(result.rows[0]).toEqual({ t: "09:15:00" });
  });
});
