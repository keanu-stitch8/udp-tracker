import { describe, expect, it } from "vitest";
import { auditLine } from "./audit";

const at = "2026-10-23T01:00:00.000Z";

describe("auditLine", () => {
  it("baru dibuat: hanya penginput", () => {
    expect(auditLine({ createdByName: "Riski", updatedByName: "Riski", createdAt: at, updatedAt: at })).toBe("Diinput oleh Riski");
  });

  it("pernah diubah: penginput dan pengubah", () => {
    expect(auditLine({ createdByName: "Riski", updatedByName: "Arpan", createdAt: at, updatedAt: "2026-10-23T02:00:00.000Z" })).toBe("Diinput oleh Riski · Diubah oleh Arpan");
  });

  it("data lama tanpa jejak", () => {
    expect(auditLine({ createdByName: null, updatedByName: null, createdAt: at, updatedAt: "2026-10-23T02:00:00.000Z" })).toBe("Diinput oleh — · Diubah oleh —");
  });
});
