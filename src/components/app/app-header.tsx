"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { subPageOf } from "./sub-page";
import { PAGE_TITLE } from "./typography";

/** Halaman bottom nav → header proyek; sub-halaman → tombol kembali + judul. Harus di dalam <Suspense> (useSearchParams). */
export function AppHeader({ projectHeader }: { projectHeader: ReactNode }) {
  const subPage = subPageOf(usePathname(), useSearchParams().get("dari"));
  if (!subPage) return projectHeader;
  return (
    <div className="flex min-h-10 items-center gap-1">
      <Link href={subPage.back} aria-label="Kembali" className="-ml-2 flex size-10 shrink-0 items-center justify-center">
        <ChevronLeft className="size-6" />
      </Link>
      <h1 className={cn(PAGE_TITLE, "truncate text-lg")}>{subPage.title}</h1>
    </div>
  );
}
