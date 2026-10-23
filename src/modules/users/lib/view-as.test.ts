import { describe, expect, it } from "vitest";
import { encodeViewAs, readViewAs } from "./view-as";

describe("cookie lihat sebagai", () => {
  it("bolak-balik", () => {
    const value = { projectId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002" };
    expect(readViewAs(encodeViewAs(value))).toEqual(value);
  });

  it("rusak/kosong → null", () => {
    expect(readViewAs(undefined)).toBeNull();
    expect(readViewAs("abc")).toBeNull();
    expect(readViewAs("a.b.c")).toBeNull();
  });
});
