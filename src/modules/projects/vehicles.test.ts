import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { wallets } from "@/db/schema";
import type { Db } from "@/db/types";
import { ConflictError, ValidationError } from "@/lib/errors";
import { getBudgetSettings } from "@/modules/budgets/queries/budget-settings";
import { createTransaction } from "@/modules/transactions/commands/save-transaction";
import { getTransactionReference } from "@/modules/transactions/queries/views";
import { createWallet } from "@/modules/wallets/commands/save-wallet";
import { createTestDb, testDivisionId, testRoot } from "@tests/helpers/test-db";
import { createProject } from "./commands/create-project";
import { createVehicle, deleteVehicle, updateVehicle } from "./commands/save-vehicle";
import { updateProject } from "./commands/update-project";
import { getProjectSettings } from "./queries/project-settings";

let db: Db;
let projectId: string;
const walletNames = async () => (await db.select().from(wallets).where(eq(wallets.projectId, projectId))).map((w) => [w.name, w.vehicleId]);

beforeEach(async () => {
  db = await createTestDb();
  projectId = (await createProject(db, testRoot, { divisionId: await testDivisionId(db), name: "Hero", startDate: "2026-10-20", endDate: "2026-10-25", pax: 3, vehicles: ["Mobil 1"] })).id;
});

describe("kelola mobil", () => {
  it("tambah mobil → dompet Flazz otomatis; jumlah mobil ikut pagu", async () => {
    const mobil2 = await createVehicle(db, projectId, { name: "Mobil 2", plate: "K 1234 AB" });
    expect(mobil2).toMatchObject({ name: "Mobil 2", plate: "K 1234 AB" });
    expect(await walletNames()).toContainEqual(["Flazz Mobil 2", mobil2.id]);
    expect((await getBudgetSettings(db, projectId)).context.vehicleCount).toBe(2);
    expect((await getProjectSettings(db, projectId)).vehicles.map((v) => [v.name, v.walletNames, v.removable])).toEqual([
      ["Mobil 1", ["Flazz Mobil 1"], true],
      ["Mobil 2", ["Flazz Mobil 2"], true],
    ]);
  });

  it("nama dompet bentrok → diberi nomor; validasi nama mobil & batas 5", async () => {
    await createWallet(db, projectId, { kind: "cash", name: "Flazz Mobil 2" });
    await createVehicle(db, projectId, { name: "Mobil 2" });
    expect((await walletNames()).map(([name]) => name)).toContain("Flazz Mobil 2 (2)");

    const error = await createVehicle(db, projectId, { name: "mobil 1" }).catch((e) => e);
    expect((error as ValidationError).fieldErrors).toEqual({ name: ["Nama mobil sudah dipakai."] });

    for (const name of ["Mobil 3", "Mobil 4", "Mobil 5"]) await createVehicle(db, projectId, { name });
    const error2 = await createVehicle(db, projectId, { name: "Mobil 6" }).catch((e) => e);
    expect((error2 as ValidationError).fieldErrors).toEqual({ _form: ["Maksimal 5 mobil per proyek."] });
  });

  it("ganti nama mobil ikut mengganti nama dompet Flazz bawaan", async () => {
    const mobil1 = (await getProjectSettings(db, projectId)).vehicles[0];
    const updated = await updateVehicle(db, projectId, mobil1.id, { name: "Innova", plate: null });
    expect(updated.name).toBe("Innova");
    expect(await walletNames()).toContainEqual(["Flazz Innova", mobil1.id]);
  });

  it("hapus mobil yang belum dipakai beserta dompet Flazz kosongnya; yang sudah dipakai ditolak", async () => {
    const mobil2 = await createVehicle(db, projectId, { name: "Mobil 2" });
    await deleteVehicle(db, projectId, mobil2.id);
    expect((await walletNames()).map(([name]) => name)).not.toContain("Flazz Mobil 2");
    expect((await getProjectSettings(db, projectId)).vehicles.map((v) => v.name)).toEqual(["Mobil 1"]);

    const ref = await getTransactionReference(db, projectId);
    const mobil1 = ref.vehicles[0].id;
    await createTransaction(db, projectId, {
      type: "expense",
      date: "2026-10-20",
      time: "09:00",
      amount: 20_000,
      walletId: ref.wallets.find((w) => w.name === "Cash")!.id,
      categoryId: ref.categories.find((c) => c.name === "Parkir Harian")!.id,
      vehicleId: mobil1,
    });
    expect((await getProjectSettings(db, projectId)).vehicles[0].removable).toBe(false);
    await expect(deleteVehicle(db, projectId, mobil1)).rejects.toBeInstanceOf(ConflictError);
  });

  it("proyek selesai dikunci", async () => {
    await updateProject(db, testRoot, projectId, { status: "done" });
    await expect(createVehicle(db, projectId, { name: "Mobil 2" })).rejects.toBeInstanceOf(ConflictError);
  });
});
