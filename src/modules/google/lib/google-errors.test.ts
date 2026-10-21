import { describe, expect, it } from "vitest";
import { googleErrorMessage, isRetryableGoogleError } from "./google-errors";

const apiError = (status: number, message: string) => Object.assign(new Error(message), { status });

describe("googleErrorMessage", () => {
  it("token kedaluwarsa/dicabut → hubungkan ulang", () => {
    expect(googleErrorMessage(new Error("invalid_grant"))).toMatch(/Hubungkan ulang akun Google/);
    expect(googleErrorMessage(apiError(401, "Invalid Credentials"))).toMatch(/Hubungkan ulang akun Google/);
  });
  it("izin kurang → centang semua izin", () => {
    expect(googleErrorMessage(apiError(403, "Request had insufficient authentication scopes."))).toMatch(/centang semua izin/);
  });
  it("API belum aktif, kuota, server Google", () => {
    expect(googleErrorMessage(apiError(403, "Google Sheets API has not been used in project 123"))).toMatch(/belum aktif/);
    expect(googleErrorMessage(apiError(429, "Quota exceeded"))).toMatch(/Kuota Google/);
    expect(googleErrorMessage(apiError(503, "Backend Error"))).toMatch(/Server Google/);
  });
});

describe("isRetryableGoogleError", () => {
  it("rate limit, 5xx, dan koneksi putus dicoba ulang; izin tidak", () => {
    expect(isRetryableGoogleError(apiError(429, "x"))).toBe(true);
    expect(isRetryableGoogleError(apiError(403, "User rate limit exceeded"))).toBe(true);
    expect(isRetryableGoogleError(apiError(500, "x"))).toBe(true);
    expect(isRetryableGoogleError(new Error("socket hang up"))).toBe(true);
    expect(isRetryableGoogleError(apiError(403, "insufficient permissions"))).toBe(false);
  });
});
