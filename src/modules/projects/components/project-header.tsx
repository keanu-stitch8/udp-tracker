import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatDateLong } from "@/modules/shared/lib/date";
import type { ProjectDetail } from "../types/project";

export function ProjectHeader({ project }: { project: ProjectDetail | null }) {
  return (
    <Link href="/proyek" className="flex items-center justify-between gap-2" aria-label="Ganti proyek">
      <div className="min-w-0">
        <p className="truncate font-head text-lg leading-tight">{project?.name ?? "Belum ada proyek"}</p>
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
