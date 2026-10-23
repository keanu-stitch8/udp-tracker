import { connection } from "next/server";
import { BottomNav } from "@/components/app/bottom-nav";
import { getDb } from "@/db/client";
import { getActiveProject } from "@/modules/projects/queries/projects";
import { canTransact } from "@/modules/wallets/lib/scope";

/** Tombol catat hanya untuk yang boleh mencatat di proyek aktif: Root/PM, atau anggota yang memegang dompet. */
export async function BottomNavSection() {
  await connection();
  const project = await getActiveProject(getDb());
  return <BottomNav showAdd={!!project && canTransact(project.walletScope)} />;
}
