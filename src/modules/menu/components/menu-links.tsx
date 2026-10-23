import { Building2, ChevronRight, FileSpreadsheet, FolderKanban, Gauge, Settings, Tags, UserCog, Users, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { UserAvatar } from "@/modules/users/components/user-avatar";
import type { CurrentUser } from "@/modules/users/types/user";

export interface MenuAccess {
  /** Root/PM di proyek aktif. */
  manage: boolean;
  root: boolean;
  hasProject: boolean;
}

interface MenuLink {
  href: string;
  label: string;
  icon: LucideIcon;
  show: (access: MenuAccess) => boolean;
}

// Menu disembunyikan sesuai peran; halamannya sendiri tetap menolak (notFound) bila dibuka langsung.
const LINKS: MenuLink[] = [
  { href: "/lainnya/dompet", label: "Dompet", icon: Wallet, show: (a) => a.hasProject },
  { href: "/lainnya/pagu", label: "Pagu", icon: Gauge, show: (a) => a.manage },
  { href: "/lainnya/kategori", label: "Kategori", icon: Tags, show: (a) => a.manage },
  { href: "/lainnya/ekspor", label: "Ekspor laporan", icon: FileSpreadsheet, show: (a) => a.manage },
  { href: "/lainnya/anggota", label: "Anggota proyek", icon: Users, show: (a) => a.manage },
  { href: "/lainnya/proyek", label: "Pengaturan proyek", icon: Settings, show: (a) => a.manage },
  { href: "/lainnya/divisi", label: "Divisi", icon: Building2, show: (a) => a.root },
  { href: "/lainnya/pengguna", label: "Pengguna", icon: UserCog, show: (a) => a.root },
  { href: "/proyek", label: "Ganti / buat proyek", icon: FolderKanban, show: () => true },
];

export function MenuLinks({ user, access }: { user: CurrentUser; access: MenuAccess }) {
  return (
    <>
      <Link href="/lainnya/profil" className="flex items-center gap-3 border-2 bg-card p-3 shadow-md">
        <UserAvatar name={user.name} email={user.email} imageUrl={user.imageUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.name ?? user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email} · Profil & riwayat</p>
        </div>
        <ChevronRight className="size-4 shrink-0" />
      </Link>
      <ul className="flex flex-col divide-y-2 border-2 bg-card shadow-md">
        {LINKS.filter((link) => link.show(access)).map(({ href, label, icon: Icon }) => (
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
    </>
  );
}
