"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NATIVE_SELECT_CLASS } from "@/components/app/form-classes";
import { MoneyInput } from "@/components/app/money-input";
import { CategoryIcon } from "@/components/app/category-icon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Toggle } from "@/components/ui/toggle";
import { ApiError } from "@/lib/api-client";
import { formatRupiah } from "@/modules/shared/lib/money";
import { BUDGET_BASES, type BudgetBasis } from "@/modules/shared/types/enums";
import { useSaveBudget } from "../hooks/use-budgets";
import { BASIS_LABELS, limitFormula } from "../lib/basis";
import { budgetLimit, usesDays } from "../lib/budget";
import type { BudgetSetting, BudgetSettings } from "../queries/budget-settings";

interface BudgetFormProps {
  settings: BudgetSettings;
  initial?: BudgetSetting;
  onDone: () => void;
}

export function BudgetForm({ settings, initial, onDone }: BudgetFormProps) {
  const save = useSaveBudget(settings.projectId, initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [rate, setRate] = useState<number | null>(initial?.rate ?? null);
  const [basis, setBasis] = useState<BudgetBasis>(initial?.basis ?? "per_pax_per_day");
  // Kosong = ikut periode proyek.
  const [days, setDays] = useState(initial?.days ? String(initial.days) : "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);

  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];
  const dayBased = usesDays(basis);
  const tripBased = basis === "per_vehicle";
  const customDays = (dayBased || tripBased) && days ? Number(days) : null;
  const preview = { rate: rate ?? 0, basis, days: customDays };
  const toggleCategory = (id: string) => setCategoryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { name, rate: rate ?? 0, basis, days: customDays, categoryIds, note: initial?.note ?? null },
          {
            onSuccess: () => {
              toast.success(initial ? "Pagu diperbarui." : "Pagu ditambahkan.");
              onDone();
            },
          },
        );
      }}
    >
      <FieldGroup>
        <Field data-invalid={errorOf("name") ? true : undefined}>
          <FieldLabel htmlFor="budget-name">Nama pagu</FieldLabel>
          <Input id="budget-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pagu Makan" />
          {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={errorOf("rate") ? true : undefined}>
            <FieldLabel htmlFor="budget-rate">Tarif</FieldLabel>
            <MoneyInput id="budget-rate" className="h-10" value={rate} onChange={setRate} />
            {errorOf("rate") && <FieldError>{errorOf("rate")}</FieldError>}
          </Field>
          <Field data-invalid={errorOf("basis") ? true : undefined}>
            <FieldLabel htmlFor="budget-basis">Dihitung</FieldLabel>
            <NativeSelect id="budget-basis" className={NATIVE_SELECT_CLASS} value={basis} onChange={(e) => setBasis(e.target.value as BudgetBasis)}>
              {BUDGET_BASES.map((b) => (
                <NativeSelectOption key={b} value={b}>
                  {BASIS_LABELS[b]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errorOf("basis") && <FieldError>{errorOf("basis")}</FieldError>}
          </Field>
        </div>
        {(dayBased || tripBased) && (
          <Field data-invalid={errorOf("days") ? true : undefined}>
            <FieldLabel htmlFor="budget-days">{tripBased ? "Jumlah trip" : "Jumlah hari"}</FieldLabel>
            <Input
              id="budget-days"
              className="h-10"
              inputMode="numeric"
              pattern="[0-9]*"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
              placeholder={tripBased ? "1" : String(settings.context.days)}
            />
            <p className="text-xs text-muted-foreground">
              {tripBased ? "Kosong = 1 trip. Isi 2 untuk pergi + pulang." : `Kosongkan untuk ikut periode proyek (${settings.context.days} hari). Isi mis. 6 untuk hari kerja.`}
            </p>
            {errorOf("days") && <FieldError>{errorOf("days")}</FieldError>}
          </Field>
        )}
        <p className="text-sm">
          {limitFormula(preview, settings.context)} = <span className="font-head">{formatRupiah(budgetLimit(preview, settings.context))}</span>
        </p>
        <Field data-invalid={errorOf("categoryIds") ? true : undefined}>
          <FieldLabel>Kategori yang dihitung</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {settings.categories.map((c) => (
              <Toggle key={c.id} pressed={categoryIds.includes(c.id)} onPressedChange={() => toggleCategory(c.id)} className="h-9 px-2.5">
                <CategoryIcon name={c.icon} className="size-4" />
                {c.name}
              </Toggle>
            ))}
          </div>
          {errorOf("categoryIds") && <FieldError>{errorOf("categoryIds")}</FieldError>}
        </Field>
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
