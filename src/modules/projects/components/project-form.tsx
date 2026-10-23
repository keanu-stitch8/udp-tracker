"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { DivisionSelect } from "@/modules/divisions/components/division-select";
import { useResetAfterSave } from "@/lib/use-reset-after-save";
import { addDays } from "@/modules/shared/lib/date";
import { useCreateProject } from "../hooks/use-projects";

/** Setelah proyek dibuat, kunjungan berikutnya ke /proyek/baru mulai kosong lagi. */
export function ProjectForm({ today, defaultDivisionId }: { today: string; defaultDivisionId: string }) {
  const { resetKey, resetWhenHidden } = useResetAfterSave();
  return <ProjectFormFields key={resetKey} today={today} defaultDivisionId={defaultDivisionId} onSaved={resetWhenHidden} />;
}

function ProjectFormFields({ today, defaultDivisionId, onSaved }: { today: string; defaultDivisionId: string; onSaved: () => void }) {
  const router = useRouter();
  const create = useCreateProject();
  const [divisionId, setDivisionId] = useState(defaultDivisionId);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 4));
  // Tanpa angka bawaan: jumlah kru diisi sendiri per proyek; mulai dari satu mobil.
  const [pax, setPax] = useState("");
  const [vehicles, setVehicles] = useState(["Mobil 1"]);

  const fieldErrors = create.error instanceof ApiError ? create.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];
  const vehicleError = Object.entries(fieldErrors).find(([key]) => key.startsWith("vehicles"))?.[1]?.[0];

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate(
          { divisionId, name, location, startDate, endDate, pax: Number(pax), vehicles: vehicles.filter((v) => v.trim()) },
          {
            onSuccess: () => {
              onSaved();
              router.push("/");
              router.refresh();
            },
          },
        );
      }}
    >
      <FieldGroup>
        <Field data-invalid={errorOf("divisionId") ? true : undefined}>
          <FieldLabel htmlFor="divisionId">Divisi</FieldLabel>
          <DivisionSelect id="divisionId" value={divisionId} onChange={setDivisionId} />
          {errorOf("divisionId") && <FieldError>{errorOf("divisionId")}</FieldError>}
        </Field>
        <Field data-invalid={errorOf("name") ? true : undefined}>
          <FieldLabel htmlFor="name">Nama proyek</FieldLabel>
          <Input id="name" placeholder="Produksi Okt 2026" value={name} onChange={(e) => setName(e.target.value)} />
          {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
        </Field>
        <Field data-invalid={errorOf("location") ? true : undefined}>
          <FieldLabel htmlFor="location">Lokasi</FieldLabel>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          {errorOf("location") && <FieldError>{errorOf("location")}</FieldError>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={errorOf("startDate") ? true : undefined}>
            <FieldLabel htmlFor="startDate">Mulai</FieldLabel>
            <DatePicker id="startDate" value={startDate} onChange={setStartDate} />
            {errorOf("startDate") && <FieldError>{errorOf("startDate")}</FieldError>}
          </Field>
          <Field data-invalid={errorOf("endDate") ? true : undefined}>
            <FieldLabel htmlFor="endDate">Selesai</FieldLabel>
            <DatePicker id="endDate" value={endDate} onChange={setEndDate} />
            {errorOf("endDate") && <FieldError>{errorOf("endDate")}</FieldError>}
          </Field>
        </div>
        <Field data-invalid={errorOf("pax") ? true : undefined}>
          <FieldLabel htmlFor="pax">Jumlah orang</FieldLabel>
          <Input id="pax" inputMode="numeric" pattern="[0-9]*" placeholder="Jumlah kru" value={pax} onChange={(e) => setPax(e.target.value.replace(/\D/g, ""))} />
          {errorOf("pax") && <FieldError>{errorOf("pax")}</FieldError>}
        </Field>
        <Field data-invalid={vehicleError ? true : undefined}>
          <FieldLabel>Mobil (tiap mobil dapat dompet Flazz sendiri)</FieldLabel>
          <div className="flex flex-col gap-2">
            {vehicles.map((vehicle, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  aria-label={`Nama mobil ${index + 1}`}
                  value={vehicle}
                  onChange={(e) => setVehicles(vehicles.map((v, i) => (i === index ? e.target.value : v)))}
                />
                <Button type="button" variant="outline" size="icon" aria-label="Hapus mobil" onClick={() => setVehicles(vehicles.filter((_, i) => i !== index))}>
                  <Minus />
                </Button>
              </div>
            ))}
            {vehicles.length < 5 && (
              <Button type="button" variant="outline" onClick={() => setVehicles([...vehicles, `Mobil ${vehicles.length + 1}`])}>
                <Plus /> Tambah mobil
              </Button>
            )}
          </div>
          {vehicleError && <FieldError>{vehicleError}</FieldError>}
        </Field>
      </FieldGroup>
      {create.error && !(create.error instanceof ApiError && Object.keys(fieldErrors).length) && (
        <p role="alert" className="text-sm text-destructive">
          {create.error.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={create.isPending}>
        {create.isPending ? "Menyimpan…" : "Buat proyek"}
      </Button>
    </form>
  );
}
