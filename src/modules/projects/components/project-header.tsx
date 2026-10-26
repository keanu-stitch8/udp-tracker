import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { CARD_TITLE, LABEL } from "@/components/app/typography";
import { cn } from "@/lib/utils";
import { formatDateLong } from "@/modules/shared/lib/date";
import type { ProjectDetail } from "../types/project";

/** Divisi tampil sebagai badge hitam di kiri nama proyek. */
export function ProjectHeader({ project, divisionName }: { project: ProjectDetail | null; divisionName: string | null }) {
  return (
    <Link href="/proyek" className="flex items-center justify-between gap-2" aria-label="Ganti proyek">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {divisionName && <span className={cn(LABEL, "shrink-0 bg-secondary px-1.5 py-0.5 text-secondary-foreground")}>{divisionName}</span>}
          <p className={cn("truncate leading-tight", CARD_TITLE, "text-lg")}>{project?.name ?? "Belum ada proyek"}</p>
        </div>
        {project && (
          <p className="truncate text-xs">
            {formatDateLong(project.startDate)} – {formatDateLong(project.endDate)}
          </p>
        )}
      </div>
      <ChevronDown className="size-5 shrink-0" />
    </Link>
  );
}
