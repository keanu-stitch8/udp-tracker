import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, expect, it } from "vitest";
import { categories, categoryGroups, divisions, projects, transactions, wallets } from "@/db/schema";
import { createTestDb, testDivisionId } from "@tests/helpers/test-db";

describe("skema DB", () => {
  it("migrasi jalan dan constraint nominal aktif", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", divisionId: await testDivisionId(db) }).returning();
    expect(project.pax).toBe(9);
    expect(project.status).toBe("active");
    const [wallet] = await db.insert(wallets).values({ projectId: project.id, kind: "cash", name: "Cash" }).returning();
    await expect(
      db.insert(transactions).values({ projectId: project.id, type: "income", date: "2026-10-20", time: "09:00", amount: 0, walletId: wallet.id }),
    ).rejects.toThrow();
  });

  it("kolom time wajib; backfill WIB dari created_at", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", divisionId: await testDivisionId(db) }).returning();
    const [wallet] = await db.insert(wallets).values({ projectId: project.id, kind: "cash", name: "Cash" }).returning();
    await expect(
      db.execute(sql`insert into transactions (project_id, type, date, amount, wallet_id) values (${project.id}, 'income', '2026-10-20', 1000, ${wallet.id})`),
    ).rejects.toThrow();
    const result = (await db.execute(sql`select date_trunc('minute', timestamptz '2026-10-21T02:15:40Z' at time zone 'Asia/Jakarta')::time as t`)) as { rows: unknown[] };
    expect(result.rows[0]).toEqual({ t: "09:15:00" });
  });

  it("kategori pengeluaran wajib punya grup, pemasukan tidak boleh", async () => {
    const db = await createTestDb();
    const [project] = await db.insert(projects).values({ name: "Hero Kudus", startDate: "2026-10-20", endDate: "2026-10-25", divisionId: await testDivisionId(db) }).returning();
    const [group] = await db.insert(categoryGroups).values({ projectId: project.id, name: "Meal" }).returning();
    const base = { projectId: project.id, icon: "ellipsis" };
    await expect(db.insert(categories).values({ ...base, kind: "expense", name: "Makan" })).rejects.toThrow();
    await expect(db.insert(categories).values({ ...base, kind: "income", name: "UDP", groupId: group.id })).rejects.toThrow();
    await db.insert(categories).values({ ...base, kind: "expense", name: "Makan", groupId: group.id });
    await expect(db.delete(categoryGroups)).rejects.toThrow();
    await db.delete(projects); // cascade grup + kategori sekaligus tetap jalan
  });

  it("migrasi 0006: proyek lama dapat 5 grup, kategori diisi menurut nama", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "migr-"));
    try {
      await cp("src/db/migrations", dir, { recursive: true });
      const journalPath = path.join(dir, "meta/_journal.json");
      const journal = JSON.parse(await readFile(journalPath, "utf8")) as { entries: { tag: string }[] };
      journal.entries = journal.entries.filter((e) => e.tag < "0006");
      await writeFile(journalPath, JSON.stringify(journal));
      const db = drizzle({ client: new PGlite(), casing: "snake_case" });
      await migrate(db, { migrationsFolder: dir });

      await db.execute(sql`insert into projects (id, name, start_date, end_date) values ('00000000-0000-4000-8000-000000000001', 'Lama', '2026-10-09', '2026-10-16')`);
      for (const [kind, name] of [["expense", "Sarapan"], ["expense", "Makan Siang"], ["expense", "Parkir"], ["expense", "Tol"], ["expense", "Laundry"], ["expense", "Biaya Admin"], ["income", "UDP Kantor"]]) {
        await db.execute(sql`insert into categories (project_id, kind, name, icon) values ('00000000-0000-4000-8000-000000000001', ${kind}, ${name}, 'ellipsis')`);
      }
      await migrate(db, { migrationsFolder: "src/db/migrations" });

      const result = (await db.execute(sql`select c.name, g.name as "group" from categories c left join category_groups g on g.id = c.group_id order by c.name`)) as { rows: unknown[] };
      expect(result.rows).toEqual([
        { name: "Biaya Admin", group: "Lain-lain" },
        { name: "Laundry", group: "Lain-lain" },
        { name: "Makan Siang", group: "Meal" },
        { name: "Parkir", group: "Operasional" },
        { name: "Sarapan", group: "Akomodasi" },
        { name: "Tol", group: "Transportation" },
        { name: "UDP Kantor", group: null },
      ]);
      const groups = (await db.execute(sql`select count(*)::int as n from category_groups`)) as { rows: { n: number }[] };
      expect(groups.rows[0].n).toBe(5);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("proyek wajib punya divisi; divisi berisi proyek tidak bisa dihapus", async () => {
    const db = await createTestDb();
    await expect(db.execute(sql`insert into projects (name, start_date, end_date) values ('Tanpa divisi', '2026-10-20', '2026-10-25')`)).rejects.toThrow();
    await db.insert(projects).values({ name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", divisionId: await testDivisionId(db) });
    await expect(db.delete(divisions)).rejects.toThrow();
  });

  it("migrasi 0007: DB baru punya divisi Umum, proyek lama masuk ke sana", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "migr-"));
    try {
      await cp("src/db/migrations", dir, { recursive: true });
      const journalPath = path.join(dir, "meta/_journal.json");
      const journal = JSON.parse(await readFile(journalPath, "utf8")) as { entries: { tag: string }[] };
      journal.entries = journal.entries.filter((e) => e.tag < "0007");
      await writeFile(journalPath, JSON.stringify(journal));
      const db = drizzle({ client: new PGlite(), casing: "snake_case" });
      await migrate(db, { migrationsFolder: dir });
      await db.execute(sql`insert into projects (name, start_date, end_date) values ('Lama 1', '2026-10-09', '2026-10-16'), ('Lama 2', '2026-11-01', '2026-11-05')`);
      await migrate(db, { migrationsFolder: "src/db/migrations" });

      const result = (await db.execute(sql`select p.name, d.name as division from projects p join divisions d on d.id = p.division_id order by p.name`)) as { rows: unknown[] };
      expect(result.rows).toEqual([
        { name: "Lama 1", division: "Umum" },
        { name: "Lama 2", division: "Umum" },
      ]);
      const count = (await db.execute(sql`select count(*)::int as n from divisions`)) as { rows: { n: number }[] };
      expect(count.rows[0].n).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
