import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./errors";
import { parseOrThrow } from "./validation";

const schema = z
  .object({ name: z.string().min(1, "Wajib diisi."), start: z.string(), end: z.string() })
  .refine((v) => v.end >= v.start, { path: ["end"], message: "Harus setelah mulai." });

describe("parseOrThrow", () => {
  it("mengembalikan data valid", () => {
    expect(parseOrThrow(schema, { name: "A", start: "1", end: "2" })).toEqual({ name: "A", start: "1", end: "2" });
  });
  it("melempar ValidationError berisi pesan per field", () => {
    try {
      parseOrThrow(schema, { name: "", start: "1", end: "2" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fieldErrors).toEqual({ name: ["Wajib diisi."] });
    }
  });
  it("refine dengan path masuk ke field-nya", () => {
    try {
      parseOrThrow(schema, { name: "A", start: "2", end: "1" });
      expect.unreachable();
    } catch (e) {
      expect((e as ValidationError).fieldErrors).toEqual({ end: ["Harus setelah mulai."] });
    }
  });
  it("input bukan objek → error _form", () => {
    try {
      parseOrThrow(schema, "x");
      expect.unreachable();
    } catch (e) {
      expect(Object.keys((e as ValidationError).fieldErrors)).toEqual(["_form"]);
    }
  });
});
