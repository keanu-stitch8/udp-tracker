"use client";

import { FolderPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CARD_TITLE } from "@/components/app/typography";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatDateLong } from "@/modules/shared/lib/date";
import { useActivateProject, useProjects } from "../hooks/use-projects";

export function ProjectList({ activeProjectId }: { activeProjectId: string | null }) {
  const router = useRouter();
  const { data: projects = [] } = useProjects();
  const activate = useActivateProject();

  if (!projects.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <FolderPlus className="size-8" />
          </EmptyMedia>
          <EmptyTitle>Belum ada proyek</EmptyTitle>
          <EmptyDescription>Buat proyek untuk mulai mencatat UDP produksi.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/proyek/baru" className={buttonVariants()}>
            Buat proyek
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((project) => {
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
      })}
    </ul>
  );
}
