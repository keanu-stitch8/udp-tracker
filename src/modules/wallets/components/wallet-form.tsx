"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NATIVE_SELECT_CLASS } from "@/components/app/form-classes";
import { MoneyInput } from "@/components/app/money-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ApiError } from "@/lib/api-client";
import type { Vehicle } from "@/modules/projects/types/project";
import { WALLET_KINDS, type WalletKind } from "@/modules/shared/types/enums";
import { useSaveWallet } from "../hooks/use-wallets";
import { WALLET_KIND_LABELS } from "../lib/kinds";
import type { Wallet } from "../types/wallet";

interface WalletFormProps {
  projectId: string;
  vehicles: Vehicle[];
  initial?: Wallet;
  onDone: () => void;
}

export function WalletForm({ projectId, vehicles, initial, onDone }: WalletFormProps) {
  const save = useSaveWallet(projectId, initial?.id);
  const [kind, setKind] = useState<WalletKind>(initial?.kind ?? "cash");
  const [name, setName] = useState(initial?.name ?? "");
  const [holder, setHolder] = useState(initial?.holder ?? "");
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? "");
  const [openingBalance, setOpeningBalance] = useState<number | null>(initial?.openingBalance ?? 0);

  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];
  const showVehicle = kind === "flazz" && vehicles.length > 0;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { kind, name, holder, vehicleId: showVehicle && vehicleId ? vehicleId : null, openingBalance: openingBalance ?? 0, archived: initial?.archived ?? false },
          {
            onSuccess: () => {
              toast.success(initial ? "Dompet diperbarui." : "Dompet ditambahkan.");
              onDone();
            },
          },
        );
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={errorOf("kind") ? true : undefined}>
            <FieldLabel htmlFor="wallet-kind">Jenis</FieldLabel>
            <NativeSelect id="wallet-kind" className={NATIVE_SELECT_CLASS} value={kind} onChange={(e) => setKind(e.target.value as WalletKind)}>
              {WALLET_KINDS.map((k) => (
                <NativeSelectOption key={k} value={k}>
                  {WALLET_KIND_LABELS[k]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errorOf("kind") && <FieldError>{errorOf("kind")}</FieldError>}
          </Field>
          <Field data-invalid={errorOf("name") ? true : undefined}>
            <FieldLabel htmlFor="wallet-name">Nama</FieldLabel>
            <Input id="wallet-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash Tim" />
            {errorOf("name") && <FieldError>{errorOf("name")}</FieldError>}
          </Field>
        </div>
        {showVehicle && (
          <Field data-invalid={errorOf("vehicleId") ? true : undefined}>
            <FieldLabel htmlFor="wallet-vehicle">Mobil</FieldLabel>
            <NativeSelect id="wallet-vehicle" className={NATIVE_SELECT_CLASS} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <NativeSelectOption value="">Tanpa mobil</NativeSelectOption>
              {vehicles.map((v) => (
                <NativeSelectOption key={v.id} value={v.id}>
                  {v.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {errorOf("vehicleId") && <FieldError>{errorOf("vehicleId")}</FieldError>}
          </Field>
        )}
        <Field data-invalid={errorOf("holder") ? true : undefined}>
          <FieldLabel htmlFor="wallet-holder">Pemegang</FieldLabel>
          <Input id="wallet-holder" className="h-10" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Opsional" />
          {errorOf("holder") && <FieldError>{errorOf("holder")}</FieldError>}
        </Field>
        <Field data-invalid={errorOf("openingBalance") ? true : undefined}>
          <FieldLabel htmlFor="wallet-opening">Saldo awal</FieldLabel>
          <MoneyInput id="wallet-opening" className="h-10" value={openingBalance} onChange={setOpeningBalance} />
          <FieldDescription>Saldo saat dompet mulai dicatat di aplikasi.</FieldDescription>
          {errorOf("openingBalance") && <FieldError>{errorOf("openingBalance")}</FieldError>}
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
