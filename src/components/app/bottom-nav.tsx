"use client";

import { CalendarDays, Ellipsis, House, ListOrdered, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/transaksi", label: "Transaksi", icon: ListOrdered },
  { href: "/lainnya", label: "Lainnya", icon: Ellipsis },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [first, second, third, fourth] = ITEMS;
  const link = (item: (typeof ITEMS)[number]) => {
    const active = isActive(pathname, item.href) && !(item.href === "/transaksi" && pathname === "/transaksi/baru");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", active ? "font-bold text-foreground" : "text-muted-foreground")}
      >
        <Icon className={cn("size-5", active && "stroke-[2.5]")} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[480px] grid-cols-5 border-t-2 border-x-2 bg-card pb-[env(safe-area-inset-bottom)]">
      {link(first)}
      {link(second)}
      <div className="flex items-start justify-center">
        <Link href="/transaksi/baru" aria-label="Catat transaksi" className={cn(buttonVariants({ size: "icon-lg" }), "-mt-6 size-14 rounded-full")}>
          <Plus className="size-7" />
        </Link>
      </div>
      {link(third)}
      {link(fourth)}
    </nav>
  );
}
