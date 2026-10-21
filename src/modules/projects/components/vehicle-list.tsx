"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useDeleteVehicle, useSaveVehicle } from "../hooks/use-project-settings";
import { MAX_VEHICLES } from "../lib/vehicles";
import type { ProjectSettings, VehicleSetting } from "../queries/project-settings";

type Editing = { kind: "new" } | { kind: "edit"; id: string } | null;

export function VehicleList({ settings, locked }: { settings: ProjectSettings; locked: boolean }) {
  const projectId = settings.project.id;
  const [editing, setEditing] = useState<Editing>(null);
  const remove = useDeleteVehicle(projectId);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y">
        {settings.vehicles.map((vehicle) =>
          editing?.kind === "edit" && editing.id === vehicle.id ? (
            <li key={vehicle.id} className="py-3">
              <VehicleForm projectId={projectId} initial={vehicle} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={vehicle.id} className="flex flex-col gap-2 py-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {vehicle.name}
                    {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{vehicle.walletNames.length ? `Dompet: ${vehicle.walletNames.join(", ")}` : "Tanpa dompet Flazz"}</p>
                </div>
                <Button size="sm" variant="outline" disabled={locked} onClick={() => setEditing({ kind: "edit", id: vehicle.id })}>
                  Ubah
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={locked || !vehicle.removable} onClick={() => setConfirmDelete(vehicle.id)}>
                  Hapus
                </Button>
              </div>
              {!vehicle.removable && <p className="text-xs text-muted-foreground">Sudah dipakai di transaksi atau dompet Flazz-nya berisi, tidak bisa dihapus.</p>}
              {confirmDelete === vehicle.id && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(vehicle.id, {
                        onSuccess: () => {
                          toast(`${vehicle.name} dihapus beserta dompet Flazz-nya.`);
                          setConfirmDelete(null);
                        },
                        onError: (error) => toast.error(error.message),
                      })
                    }
                  >
                    Ya, hapus {vehicle.name}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                    Batal
                  </Button>
                </div>
              )}
            </li>
          ),
        )}
      </ul>
      {editing?.kind === "new" ? (
        <div className="border-2 p-3">
          <VehicleForm projectId={projectId} onDone={() => setEditing(null)} />
        </div>
      ) : (
        <Button variant="outline" disabled={locked || settings.vehicles.length >= MAX_VEHICLES} onClick={() => setEditing({ kind: "new" })}>
          + Tambah mobil
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Mobil baru otomatis dapat dompet Flazz. Jumlah mobil dipakai untuk pagu per mobil.</p>
    </div>
  );
}

function VehicleForm({ projectId, initial, onDone }: { projectId: string; initial?: VehicleSetting; onDone: () => void }) {
  const save = useSaveVehicle(projectId, initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { name, plate },
          {
            onSuccess: () => {
              toast.success(initial ? "Mobil diperbarui." : "Mobil ditambahkan beserta dompet Flazz-nya.");
              onDone();
            },
          },
        );
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={errorOf("name") ? true : undefined}>
            <FieldLabel htmlFor="vehicle-name">Nama mobil</FieldLabel>
            <Input id="vehicle-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mobil 2" />
            {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
          </Field>
          <Field data-invalid={errorOf("plate") ? true : undefined}>
            <FieldLabel htmlFor="vehicle-plate">Plat</FieldLabel>
            <Input id="vehicle-plate" className="h-10" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Opsional" />
            {errorOf("plate") && <FieldError>{errorOf("plate")}</FieldError>}
          </Field>
        </div>
      </FieldGroup>
      {(errorOf("_form") || (save.error && !Object.keys(fieldErrors).length)) && (
        <p role="alert" className="text-sm text-destructive">
          {errorOf("_form") ?? save.error?.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  );
}
