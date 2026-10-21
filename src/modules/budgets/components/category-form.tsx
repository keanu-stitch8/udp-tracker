"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/app/category-icon";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiError } from "@/lib/api-client";
import { CATEGORY_ICONS, type CategoryIconName } from "@/modules/shared/types/category-icons";
import type { CategoryKind } from "@/modules/shared/types/enums";
import { useSaveCategory } from "../hooks/use-categories";
import type { Category } from "../types/category";

const KIND_LABELS: Record<CategoryKind, string> = { expense: "Pengeluaran", income: "Pemasukan" };

interface CategoryFormProps {
  projectId: string;
  defaultKind: CategoryKind;
  initial?: Category;
  onDone: () => void;
}

export function CategoryForm({ projectId, defaultKind, initial, onDone }: CategoryFormProps) {
  const save = useSaveCategory(projectId, initial?.id);
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? defaultKind);
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState<CategoryIconName>((initial?.icon as CategoryIconName | undefined) ?? "ellipsis");
  const [isVehicleRelated, setIsVehicleRelated] = useState(initial?.isVehicleRelated ?? false);

  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { kind, name, icon, isVehicleRelated: kind === "expense" && isVehicleRelated, archived: initial?.archived ?? false },
          {
            onSuccess: () => {
              toast.success(initial ? "Kategori diperbarui." : "Kategori ditambahkan.");
              onDone();
            },
          },
        );
      }}
    >
      <FieldGroup>
        {!initial && (
          <Field data-invalid={errorOf("kind") ? true : undefined}>
            <FieldLabel>Jenis</FieldLabel>
            <ToggleGroup aria-label="Jenis kategori" className="w-full" spacing={0} value={[kind]} onValueChange={(values) => values[0] && setKind(values[0] as CategoryKind)}>
              {(Object.keys(KIND_LABELS) as CategoryKind[]).map((value) => (
                <ToggleGroupItem key={value} value={value} className="h-10 flex-1">
                  {KIND_LABELS[value]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {errorOf("kind") && <FieldError>{errorOf("kind")}</FieldError>}
          </Field>
        )}
        <Field data-invalid={errorOf("name") ? true : undefined}>
          <FieldLabel htmlFor="category-name">Nama</FieldLabel>
          <Input id="category-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel" />
          {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
        </Field>
        <Field data-invalid={errorOf("icon") ? true : undefined}>
          <FieldLabel>Ikon</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((value) => (
              <Toggle key={value} aria-label={value} pressed={icon === value} onPressedChange={() => setIcon(value)} className="size-10 p-0">
                <CategoryIcon name={value} className="size-5" />
              </Toggle>
            ))}
          </div>
          {errorOf("icon") && <FieldError>{errorOf("icon")}</FieldError>}
        </Field>
        {kind === "expense" && (
          <Field data-invalid={errorOf("isVehicleRelated") ? true : undefined}>
            <Toggle pressed={isVehicleRelated} onPressedChange={setIsVehicleRelated} className="h-10 self-start px-3">
              Terkait mobil
            </Toggle>
            <FieldDescription>Saat mencatat, muncul pilihan mobil (mis. BBM, tol, parkir).</FieldDescription>
            {errorOf("isVehicleRelated") && <FieldError>{errorOf("isVehicleRelated")}</FieldError>}
          </Field>
        )}
      </FieldGroup>
      {save.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  );
}
