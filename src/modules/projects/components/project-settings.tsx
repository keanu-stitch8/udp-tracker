"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useProjectSettings, useUpdateProject } from "../hooks/use-project-settings";
import type { ProjectDetail } from "../types/project";
import { DeleteProject } from "./delete-project";
import { VehicleList } from "./vehicle-list";

export function ProjectSettingsPanel({ projectId }: { projectId: string }) {
  const { data } = useProjectSettings(projectId);
  if (!data) return null;
  const { project } = data;
  const locked = project.status === "done";

  return (
    <div className="flex flex-col gap-4">
      {locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Data dikunci. Buka lagi di bagian Status untuk mengubah.</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectDetailsForm project={project} locked={locked} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobil</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleList settings={data} locked={locked} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>{locked ? "Proyek selesai: semua data dikunci." : "Tandai selesai setelah laporan final. Data dikunci, tapi bisa dibuka lagi."}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectStatus project={project} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Hapus proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteProject project={project} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectDetailsForm({ project, locked }: { project: ProjectDetail; locked: boolean }) {
  const update = useUpdateProject(project.id);
  const [name, setName] = useState(project.name);
  const [location, setLocation] = useState(project.location);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const [pax, setPax] = useState(String(project.pax));
  const fieldErrors = update.error instanceof ApiError ? update.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ name, location, startDate, endDate, pax: Number(pax) }, { onSuccess: () => toast.success("Pengaturan proyek disimpan.") });
      }}
    >
      <FieldGroup>
        <Field data-invalid={errorOf("name") ? true : undefined}>
          <FieldLabel htmlFor="settings-name">Nama proyek</FieldLabel>
          <Input id="settings-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} />
          {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
        </Field>
        <Field data-invalid={errorOf("location") ? true : undefined}>
          <FieldLabel htmlFor="settings-location">Lokasi</FieldLabel>
          <Input id="settings-location" className="h-10" value={location} onChange={(e) => setLocation(e.target.value)} />
          {errorOf("location") && <FieldError>{errorOf("location")}</FieldError>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={errorOf("startDate") ? true : undefined}>
            <FieldLabel htmlFor="settings-start">Mulai</FieldLabel>
            <DatePicker id="settings-start" className="h-10" value={startDate} onChange={setStartDate} />
            {errorOf("startDate") && <FieldError>{errorOf("startDate")}</FieldError>}
          </Field>
          <Field data-invalid={errorOf("endDate") ? true : undefined}>
            <FieldLabel htmlFor="settings-end">Selesai</FieldLabel>
            <DatePicker id="settings-end" className="h-10" value={endDate} onChange={setEndDate} />
            {errorOf("endDate") && <FieldError>{errorOf("endDate")}</FieldError>}
          </Field>
        </div>
        <Field data-invalid={errorOf("pax") ? true : undefined}>
          <FieldLabel htmlFor="settings-pax">Jumlah orang</FieldLabel>
          <Input id="settings-pax" className="h-10" inputMode="numeric" pattern="[0-9]*" value={pax} onChange={(e) => setPax(e.target.value.replace(/\D/g, ""))} />
          <FieldDescription>Periode dan jumlah orang dipakai untuk menghitung pagu.</FieldDescription>
          {errorOf("pax") && <FieldError>{errorOf("pax")}</FieldError>}
        </Field>
      </FieldGroup>
      {update.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="text-sm text-destructive">
          {update.error.message}
        </p>
      )}
      <Button type="submit" disabled={locked || update.isPending}>
        {update.isPending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}

function ProjectStatus({ project }: { project: ProjectDetail }) {
  const update = useUpdateProject(project.id);
  const done = project.status === "done";
  return (
    <Button
      variant={done ? "default" : "outline"}
      className="w-full"
      disabled={update.isPending}
      onClick={() =>
        update.mutate(
          { status: done ? "active" : "done" },
          {
            onSuccess: () => toast.success(done ? "Proyek dibuka lagi." : "Proyek ditandai selesai dan dikunci."),
            onError: (error) => toast.error(error.message),
          },
        )
      }
    >
      {done ? "Buka lagi" : "Tandai selesai"}
    </Button>
  );
}
