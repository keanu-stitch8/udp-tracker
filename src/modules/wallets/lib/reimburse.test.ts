import { describe, expect, it } from "vitest";
import { reimburseStatus } from "./reimburse";

describe("reimburseStatus", () => {
  it("minus = belum diganti, 0 = lunas, plus = lebih diganti", () => {
    expect(reimburseStatus(-669_800)).toBe("Belum diganti Rp 669.800");
    expect(reimburseStatus(0)).toBe("Lunas");
    expect(reimburseStatus(2_000)).toBe("Lebih diganti Rp 2.000");
  });
});
