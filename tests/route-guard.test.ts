import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function routeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile() && e.name === "route.ts").map((e) => path.join(e.parentPath, e.name));
}

const handlers = (source: string) => [...source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE) = (\w+)\(/g)].map(([, method, wrapper]) => `${method}:${wrapper}`);

// Spec akses §5: penjagaan tidak boleh bergantung pada ingatan. Route baru tanpa pembungkus yang benar → tes gagal.
describe("penjaga route", () => {
  it("setiap route di api/projects/[projectId] memakai projectRoute", async () => {
    const files = await routeFiles("src/app/api/projects/[projectId]");
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      const found = handlers(await readFile(file, "utf8"));
      expect(found.length, file).toBeGreaterThan(0);
      expect(found.filter((h) => !h.endsWith(":projectRoute")), file).toEqual([]);
    }
  });

  it("kelola divisi dan pengguna khusus Root", async () => {
    const files = [...(await routeFiles("src/app/api/divisions/[divisionId]")), ...(await routeFiles("src/app/api/users"))];
    expect(files.length).toBeGreaterThan(1);
    for (const file of files) {
      expect(handlers(await readFile(file, "utf8")).filter((h) => !h.endsWith(":rootRoute")), file).toEqual([]);
    }
    expect(handlers(await readFile("src/app/api/divisions/route.ts", "utf8"))).toEqual(["GET:route", "POST:rootRoute"]);
  });

  it("route tanpa sesi hanya login, callback, dan logout", async () => {
    const files = await routeFiles("src/app/api");
    const publicFiles: string[] = [];
    for (const file of files) if ((await readFile(file, "utf8")).includes("publicRoute(")) publicFiles.push(path.relative("src/app/api", file));
    expect(publicFiles.sort()).toEqual(["auth/google/callback/route.ts", "auth/google/login/route.ts", "auth/logout/route.ts"]);
  });
});
