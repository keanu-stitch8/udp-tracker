"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useSaveCategoryGroup } from "../hooks/use-categories";
import type { CategoryGroup } from "../types/category-group";

/** Tambah grup (tanpa `initial`) atau ganti nama grup. */
export function CategoryGroupForm({ projectId, initial, onDone }: { projectId: string; initial?: CategoryGroup; onDone: () => void }) {
  const save = useSaveCategoryGroup(projectId, initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const error = save.error instanceof ApiError ? (save.error.fieldErrors.name?.[0] ?? save.error.message) : save.error?.message;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { name },
          {
            onSuccess: () => {
              toast.success(initial ? "Grup diganti nama." : "Grup ditambahkan.");
              onDone();
            },
          },
        );
      }}
    >
      <Field data-invalid={error ? true : undefined}>
        <Input aria-label="Nama grup" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Akomodasi" autoFocus />
        {error && <FieldError>{error}</FieldError>}
      </Field>
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
