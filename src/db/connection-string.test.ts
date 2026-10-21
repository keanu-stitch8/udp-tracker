import { describe, expect, it } from "vitest";
import { withVerifiedSsl } from "./connection-string";

describe("withVerifiedSsl", () => {
  it("mengunci sslmode=require menjadi verify-full (perilaku aman pg v8, tetap aman di pg v9)", () => {
    expect(withVerifiedSsl("postgresql://u:p@h.neon.tech/db?channel_binding=require&sslmode=require")).toBe(
      "postgresql://u:p@h.neon.tech/db?channel_binding=require&sslmode=verify-full",
    );
  });
  it("tidak mengubah URL tanpa sslmode=require", () => {
    expect(withVerifiedSsl("postgresql://u:p@localhost/db")).toBe("postgresql://u:p@localhost/db");
    expect(withVerifiedSsl("postgresql://u:p@h/db?sslmode=verify-full")).toBe("postgresql://u:p@h/db?sslmode=verify-full");
  });
});
