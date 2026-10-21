import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLong } from "@/modules/shared/lib/date";
import type { ProjectDetail } from "@/modules/projects/types/project";

export function ProjectOverviewCard({ project }: { project: ProjectDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-head text-xl">{project.name}</CardTitle>
        <CardDescription>{project.location || "Lokasi belum diisi"}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Periode</dt>
            <dd>
              {formatDateLong(project.startDate)} – {formatDateLong(project.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Durasi</dt>
            <dd>{project.days} hari</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tim</dt>
            <dd>{project.pax} orang</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mobil</dt>
            <dd>{project.vehicles.length ? project.vehicles.map((v) => v.name).join(", ") : "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
