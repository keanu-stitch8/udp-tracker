import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, toErrorResponse, TooManyRequestsError, UnauthorizedError, ValidationError } from "./errors";

describe("toErrorResponse", () => {
  it("ValidationError → 422 + fieldErrors", async () => {
    const res = toErrorResponse(new ValidationError({ name: ["Wajib diisi."] }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Periksa kembali isian yang ditandai.", fieldErrors: { name: ["Wajib diisi."] } });
  });
  it("AppError lain memakai status masing-masing", async () => {
    expect(toErrorResponse(new UnauthorizedError()).status).toBe(401);
    expect(toErrorResponse(new NotFoundError()).status).toBe(404);
    expect(toErrorResponse(new ConflictError("Terkunci.")).status).toBe(409);
    const res = toErrorResponse(new TooManyRequestsError("Tunggu."));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Tunggu." });
  });
  it("error tak dikenal → 500 tanpa membocorkan detail", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = toErrorResponse(new Error("password=rahasia"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Terjadi kesalahan di server. Coba lagi." });
    spy.mockRestore();
  });
});
