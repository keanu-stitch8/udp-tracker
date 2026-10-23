"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useDeleteProject } from "../hooks/use-project-settings";
import type { ProjectDetail } from "../types/project";

/** Dua langkah: buka → ketik ulang nama proyek → "Hapus permanen". Sukses → reload penuh agar cache & state halaman terbuang. */
export function DeleteProject({ project }: { project: ProjectDetail }) {
  const remove = useDeleteProject(project.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const fieldErrors = remove.error instanceof ApiError ? remove.error.fieldErrors : {};

  if (!open) {
    return (
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        Hapus proyek…
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        remove.mutate(name, {
          onSuccess: () => {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/proyek";
          },
        });
      }}
    >
      <p className="text-sm">
        Semua transaksi, dompet, kategori, pagu, cek saldo, dan foto bon proyek <span className="font-head font-bold">{project.name}</span> akan dihapus permanen dan tidak bisa dikembalikan.
      </p>
      <Field data-invalid={fieldErrors.name ? true : undefined}>
        <FieldLabel htmlFor="delete-name">Ketik nama proyek untuk konfirmasi</FieldLabel>
        <Input id="delete-name" autoComplete="off" className="h-10" placeholder={project.name} value={name} onChange={(e) => setName(e.target.value)} />
        {fieldErrors.name && <FieldError>{fieldErrors.name[0]}</FieldError>}
      </Field>
      {remove.error && !fieldErrors.name && (
        <p role="alert" className="text-sm text-destructive">
          {remove.error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" className="flex-1" disabled={name.trim() !== project.name.trim() || remove.isPending}>
          {remove.isPending ? "Menghapus…" : "Hapus permanen"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setName("");
          }}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
