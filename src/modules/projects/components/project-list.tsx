"use client";

import { FolderPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CARD_TITLE, LABEL } from "@/components/app/typography";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useDivisions } from "@/modules/divisions/hooks/use-divisions";
import { formatDateLong } from "@/modules/shared/lib/date";
import { useActivateProject, useProjects } from "../hooks/use-projects";
import { groupProjectsByDivision } from "../lib/group-by-division";
import type { Project } from "../types/project";

export function ProjectList({ activeProjectId, canCreate }: { activeProjectId: string | null; canCreate: boolean }) {
  const router = useRouter();
  const { data: projects = [] } = useProjects();
  const { data: divisions = [] } = useDivisions();
  const activate = useActivateProject();

  if (!projects.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <FolderPlus className="size-8" />
          </EmptyMedia>
          <EmptyTitle>Belum ada proyek</EmptyTitle>
          <EmptyDescription>{canCreate ? "Buat proyek untuk mulai mencatat UDP produksi." : "Minta PM menambahkan kamu ke proyek."}</EmptyDescription>
        </EmptyHeader>
        {canCreate && (
          <EmptyContent>
            <Link href="/proyek/baru" className={buttonVariants()}>
              Buat proyek
            </Link>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  const renderProject = (project: Project) => {
    const isActive = project.id === activeProjectId;
    return (
      <li key={project.id}>
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>{project.name}</CardTitle>
            <CardDescription>
              {formatDateLong(project.startDate)} – {formatDateLong(project.endDate)}
              {project.location ? ` · ${project.location}` : ""}
              {project.status === "done" ? " · Selesai" : ""}
            </CardDescription>
            <CardAction>
              {isActive ? (
                <Badge>Aktif</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activate.isPending}
                  onClick={() =>
                    activate.mutate(project.id, {
                      onSuccess: () => {
                        router.push("/");
                        router.refresh();
                      },
                      onError: (error) => toast.error(error.message),
                    })
                  }
                >
                  Pakai
                </Button>
              )}
            </CardAction>
          </CardHeader>
        </Card>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {canCreate && (
        <div className="flex justify-end">
          <Link href="/proyek/baru" className={buttonVariants({ size: "sm" })}>
            + Proyek baru
          </Link>
        </div>
      )}
      {groupProjectsByDivision(projects, divisions).map(({ division, projects: divisionProjects }) => (
        <section key={division.id} className="flex flex-col gap-3">
          <h2 className={LABEL}>{division.name}</h2>
          <ul className="flex flex-col gap-3">{divisionProjects.map(renderProject)}</ul>
        </section>
      ))}
    </div>
  );
}
