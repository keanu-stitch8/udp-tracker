import { describe, expect, it } from "vitest";
import { BUDGET_BASES, CATEGORY_KINDS, PROJECT_STATUSES, TRANSACTION_TYPES, WALLET_KINDS } from "./enums";

describe("enums", () => {
  it("memuat nilai sesuai spec §3.1", () => {
    expect(PROJECT_STATUSES).toEqual(["active", "done"]);
    expect(WALLET_KINDS).toEqual(["bank", "cash", "flazz", "ewallet", "reimburse"]);
    expect(CATEGORY_KINDS).toEqual(["expense", "income"]);
    expect(BUDGET_BASES).toEqual(["per_pax_per_day", "per_vehicle_per_day", "per_vehicle", "per_day", "lump_sum"]);
    expect(TRANSACTION_TYPES).toEqual(["expense", "income", "transfer"]);
  });
});
