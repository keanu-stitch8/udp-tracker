import { describe, expect, it } from "vitest";
import { WALLET_KIND_LABELS } from "./kinds";

describe("label jenis dompet", () => {
  it("setiap jenis punya label", () => {
    expect(WALLET_KIND_LABELS).toEqual({ bank: "Rekening", cash: "Cash", flazz: "Flazz", ewallet: "E-wallet", reimburse: "Reimburse" });
  });
});
