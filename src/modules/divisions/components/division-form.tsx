"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useSaveDivision } from "../hooks/use-divisions";
import type { Division } from "../types/division";

/** Tambah divisi (tanpa `initial`) atau ganti nama divisi. */
export function DivisionForm({ initial, onDone }: { initial?: Division; onDone: () => void }) {
  const save = useSaveDivision(initial?.id);
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
              toast.success(initial ? "Divisi diganti nama." : "Divisi ditambahkan.");
              onDone();
            },
          },
        );
      }}
    >
      <Field data-invalid={error ? true : undefined}>
        <Input aria-label="Nama divisi" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="MKK" autoFocus />
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
