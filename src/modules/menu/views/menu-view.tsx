import { Building2, ChevronRight, FileSpreadsheet, FolderKanban, Gauge, Settings, Tags, Wallet } from "lucide-react";
import Link from "next/link";
import { PAGE_TITLE } from "@/components/app/typography";
import { LogoutButton } from "@/modules/auth/components/logout-button";

const LINKS = [
  { href: "/lainnya/dompet", label: "Dompet", icon: Wallet },
  { href: "/lainnya/pagu", label: "Pagu", icon: Gauge },
  { href: "/lainnya/kategori", label: "Kategori", icon: Tags },
  { href: "/lainnya/ekspor", label: "Ekspor laporan", icon: FileSpreadsheet },
  { href: "/lainnya/proyek", label: "Pengaturan proyek", icon: Settings },
  { href: "/lainnya/divisi", label: "Divisi", icon: Building2 },
  { href: "/proyek", label: "Ganti / buat proyek", icon: FolderKanban },
] as const;

export function MenuView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Lainnya</h1>
      <ul className="flex flex-col divide-y-2 border-2 bg-card shadow-md">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 items-center gap-3 px-4">
              <Icon className="size-5" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
      <LogoutButton />
    </div>
  );
}
