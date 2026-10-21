// Salin komponen NeoBrutalism (ex-RetroUI) apa adanya dari registry ke src/components/ui.
// `shadcn add` me-resolve registryDependencies tanpa namespace (mis. "button") ke registry default shadcn,
// sehingga versi NeoBrutalism tertimpa (terbukti 2026-10-21) — script ini me-resolve semuanya dari registry NeoBrutalism.
// `npm run ui:sync`  → tulis file + tampilkan paket npm yang dibutuhkan
// `npm run ui:check` → gagal jika ada file yang hilang/diedit (komponen asli tidak boleh diubah)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; content: string }[];
}

interface UiConfig {
  registry: string;
  outDir: string;
  components: string[];
}

const config = JSON.parse(await readFile("ui.config.json", "utf8")) as UiConfig;
const check = process.argv.includes("--check");

async function fetchItem(name: string, attempts = 3): Promise<RegistryItem> {
  try {
    const res = await fetch(config.registry.replace("{name}", name));
    if (!res.ok) throw new Error(`Registry item "${name}" gagal diambil: HTTP ${res.status}`);
    return (await res.json()) as RegistryItem;
  } catch (error) {
    // Jaringan kadang putus sesaat — coba ulang sebelum menyerah.
    if (attempts <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fetchItem(name, attempts - 1);
  }
}

const items = new Map<string, RegistryItem>();
const queue = [...config.components];
while (queue.length) {
  const name = queue.shift()!;
  if (items.has(name)) continue;
  const item = await fetchItem(name);
  items.set(name, item);
  queue.push(...(item.registryDependencies ?? []));
}

const npmDeps = new Set<string>();
const problems: string[] = [];
for (const item of items.values()) {
  item.dependencies?.forEach((dep) => npmDeps.add(dep));
  for (const file of item.files) {
    const target = path.join(config.outDir, path.basename(file.path));
    if (check) {
      const local = await readFile(target, "utf8").catch(() => null);
      if (local === null) problems.push(`hilang: ${target}`);
      else if (local !== file.content) problems.push(`berbeda dari registry: ${target}`);
    } else {
      await mkdir(config.outDir, { recursive: true });
      await writeFile(target, file.content);
    }
  }
}

if (check) {
  if (problems.length) {
    console.error(problems.join("\n"));
    console.error("Jangan edit src/components/ui — bungkus di src/components/app. Jalankan `npm run ui:sync` untuk memulihkan.");
    process.exit(1);
  }
  console.log(`OK: ${items.size} komponen sama dengan registry.`);
} else {
  console.log(`Ditulis: ${[...items.keys()].sort().join(", ")}`);
  console.log(`Paket npm yang dibutuhkan: npm i ${[...npmDeps].sort().join(" ")}`);
}
