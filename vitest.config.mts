import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Tiap test PGlite menjalankan semua migrasi; di bawah beban bisa lewat dari default 5 detik.
    testTimeout: 15_000,
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
  },
});
