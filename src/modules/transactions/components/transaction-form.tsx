"use client";

import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/app/category-icon";
import { MoneyInput } from "@/components/app/money-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiError } from "@/lib/api-client";
import { useResetAfterSave } from "@/lib/use-reset-after-save";
import { formatDateLong } from "@/modules/shared/lib/date";
import type { TransactionType } from "@/modules/shared/types/enums";
import { ledgerKeys } from "../hooks/keys";
import { restoreTransactionRequest, useDeleteTransaction, useSaveTransaction } from "../hooks/use-transactions";
import type { TransactionReference } from "../queries/views";
import type { TransactionView } from "../types/transaction";

const TYPE_LABELS: Record<TransactionType, string> = { expense: "Pengeluaran", income: "Pemasukan", transfer: "Transfer" };
const ADMIN_FEE_PRESETS = [0, 2_500, 6_500];

interface TransactionFormProps {
  reference: TransactionReference;
  defaultDate: string;
  returnTo: string;
  initial?: TransactionView;
}

/** Form baru mulai kosong lagi setelah tersimpan. Form ubah tidak di-reset: nilainya sudah sama dengan data tersimpan. */
export function TransactionForm(props: TransactionFormProps) {
  const { resetKey, resetWhenHidden } = useResetAfterSave();
  return <TransactionFormFields key={resetKey} {...props} onSaved={props.initial ? undefined : resetWhenHidden} />;
}

function TransactionFormFields({ reference, defaultDate, returnTo, initial, onSaved }: TransactionFormProps & { onSaved?: () => void }) {
  const router = useRouter();
  const projectId = reference.project.id;
  const save = useSaveTransaction(projectId, initial?.id);
  const remove = useDeleteTransaction(projectId);
  const queryClient = useQueryClient();
  const locked = reference.project.status === "done";

  const defaultWalletId = reference.lastWalletId ?? reference.wallets[0]?.id ?? "";
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState<number | null>(initial?.amount ?? null);
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [walletId, setWalletId] = useState(initial?.walletId ?? defaultWalletId);
  const [toWalletId, setToWalletId] = useState<string | null>(initial?.toWalletId ?? null);
  const [adminFee, setAdminFee] = useState<number | null>(initial?.adminFee ?? 0);
  const [vehicleId, setVehicleId] = useState<string | null>(initial?.vehicleId ?? null);
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const categories = reference.categories.filter((c) => c.kind === type);
  const category = reference.categories.find((c) => c.id === categoryId);
  const showVehicle = type !== "transfer" && !!category?.isVehicleRelated && reference.vehicles.length > 0;
  const outsidePeriod = date < reference.project.startDate || date > reference.project.endDate;

  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];
  const generalError = save.error && !Object.keys(fieldErrors).length ? save.error.message : null;

  function changeType(next: TransactionType) {
    setType(next);
    if (category && category.kind !== next) setCategoryId(null);
    if (next === "transfer") setVehicleId(null);
  }

  function chooseCategory(id: string) {
    const next = reference.categories.find((c) => c.id === id);
    setCategoryId(id);
    if (!next?.isVehicleRelated) setVehicleId(null);
  }

  function chooseVehicle(id: string | null) {
    setVehicleId(id);
    // Tol dibayar pakai Flazz mobil itu (spec §5) → pilih otomatis dompet Flazz-nya.
    const flazz = reference.wallets.find((w) => w.kind === "flazz" && w.vehicleId === id);
    if (id && flazz && category?.name.toLowerCase() === "tol") setWalletId(flazz.id);
  }

  function submit() {
    save.mutate(
      {
        type,
        date,
        amount: amount ?? 0,
        categoryId: type === "transfer" ? null : categoryId,
        walletId,
        toWalletId: type === "transfer" ? toWalletId : null,
        adminFee: type === "transfer" ? (adminFee ?? 0) : 0,
        vehicleId: showVehicle ? vehicleId : null,
        merchant,
        note,
      },
      {
        onSuccess: () => {
          toast.success(initial ? "Perubahan disimpan." : "Transaksi tersimpan.");
          onSaved?.();
          router.push(returnTo);
          router.refresh();
        },
      },
    );
  }

  function deleteCurrent() {
    if (!initial) return;
    remove.mutate(initial.id, {
      onSuccess: () => {
        toast("Transaksi dihapus.", {
          action: {
            label: "Urungkan",
            onClick: () =>
              restoreTransactionRequest(projectId, initial.id)
                .then(() => {
                  void queryClient.invalidateQueries({ queryKey: ledgerKeys.all(projectId) });
                  router.refresh();
                  toast.success("Transaksi dikembalikan.");
                })
                .catch((error: Error) => toast.error(error.message)),
          },
        });
        router.push(returnTo);
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Data dikunci. Buka kembali proyek di Pengaturan untuk mengubah transaksi.</AlertDescription>
        </Alert>
      )}

      <ToggleGroup
        aria-label="Jenis transaksi"
        className="w-full"
        spacing={0}
        value={[type]}
        onValueChange={(values) => values[0] && changeType(values[0] as TransactionType)}
      >
        {(Object.keys(TYPE_LABELS) as TransactionType[]).map((value) => (
          <ToggleGroupItem key={value} value={value} className="h-11 flex-1">
            {TYPE_LABELS[value]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <FieldGroup>
        <Field data-invalid={errorOf("amount") ? true : undefined}>
          <FieldLabel htmlFor="amount">Nominal</FieldLabel>
          <MoneyInput id="amount" autoFocus={!initial} className="h-14 font-head text-2xl" value={amount} onChange={setAmount} placeholder="0" />
          {errorOf("amount") && <FieldError>{errorOf("amount")}</FieldError>}
        </Field>

        <Field data-invalid={errorOf("date") ? true : undefined}>
          <FieldLabel htmlFor="date">Tanggal</FieldLabel>
          <Input id="date" type="date" className="h-11" value={date} onChange={(e) => setDate(e.target.value)} />
          {outsidePeriod && (
            <p className="text-sm text-muted-foreground">
              Di luar periode proyek ({formatDateLong(reference.project.startDate)} – {formatDateLong(reference.project.endDate)}).
            </p>
          )}
          {errorOf("date") && <FieldError>{errorOf("date")}</FieldError>}
        </Field>

        {type !== "transfer" && (
          <Field data-invalid={errorOf("categoryId") ? true : undefined}>
            <FieldLabel>Kategori</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <Toggle key={c.id} pressed={categoryId === c.id} onPressedChange={() => chooseCategory(c.id)} className="h-auto min-h-16 flex-col gap-1 py-2 text-xs whitespace-normal">
                  <CategoryIcon name={c.icon} className="size-5" />
                  {c.name}
                </Toggle>
              ))}
            </div>
            {errorOf("categoryId") && <FieldError>{errorOf("categoryId")}</FieldError>}
          </Field>
        )}

        <Field data-invalid={errorOf("walletId") ? true : undefined}>
          <FieldLabel>{type === "transfer" ? "Dari dompet" : type === "income" ? "Masuk ke dompet" : "Dompet"}</FieldLabel>
          <WalletChips wallets={reference.wallets} value={walletId} onChange={setWalletId} />
          {errorOf("walletId") && <FieldError>{errorOf("walletId")}</FieldError>}
        </Field>

        {type === "transfer" && (
          <>
            <Field data-invalid={errorOf("toWalletId") ? true : undefined}>
              <FieldLabel>Ke dompet</FieldLabel>
              <WalletChips wallets={reference.wallets.filter((w) => w.id !== walletId)} value={toWalletId ?? ""} onChange={setToWalletId} />
              {errorOf("toWalletId") && <FieldError>{errorOf("toWalletId")}</FieldError>}
            </Field>
            <Field data-invalid={errorOf("adminFee") ? true : undefined}>
              <FieldLabel htmlFor="adminFee">Biaya admin</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {ADMIN_FEE_PRESETS.map((fee) => (
                  <Toggle key={fee} pressed={adminFee === fee} onPressedChange={() => setAdminFee(fee)} className="h-10 px-3">
                    {fee === 0 ? "Gratis" : new Intl.NumberFormat("id-ID").format(fee)}
                  </Toggle>
                ))}
              </div>
              <MoneyInput id="adminFee" className="h-11" value={adminFee} onChange={setAdminFee} />
              {errorOf("adminFee") && <FieldError>{errorOf("adminFee")}</FieldError>}
            </Field>
          </>
        )}

        {showVehicle && (
          <Field data-invalid={errorOf("vehicleId") ? true : undefined}>
            <FieldLabel>Mobil</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {reference.vehicles.map((v) => (
                <Toggle key={v.id} pressed={vehicleId === v.id} onPressedChange={(pressed) => chooseVehicle(pressed ? v.id : null)} className="h-10 px-3">
                  {v.name}
                </Toggle>
              ))}
            </div>
            {errorOf("vehicleId") && <FieldError>{errorOf("vehicleId")}</FieldError>}
          </Field>
        )}

        <Field data-invalid={errorOf("merchant") ? true : undefined}>
          <FieldLabel htmlFor="merchant">{type === "transfer" ? "Keterangan" : "Toko / keterangan"}</FieldLabel>
          <Input id="merchant" className="h-11" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Opsional" />
          {errorOf("merchant") && <FieldError>{errorOf("merchant")}</FieldError>}
        </Field>

        <Field data-invalid={errorOf("note") ? true : undefined}>
          <FieldLabel htmlFor="note">Catatan</FieldLabel>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          {errorOf("note") && <FieldError>{errorOf("note")}</FieldError>}
        </Field>
      </FieldGroup>

      {generalError && (
        <p role="alert" className="text-sm text-destructive">
          {generalError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={save.isPending || locked}>
        {save.isPending ? "Menyimpan…" : initial ? "Simpan perubahan" : "Simpan"}
      </Button>
      {initial && (
        <Button type="button" variant="outline" onClick={deleteCurrent} disabled={remove.isPending || locked}>
          <Trash2 /> Hapus transaksi
        </Button>
      )}
    </form>
  );
}

function WalletChips({ wallets, value, onChange }: { wallets: TransactionReference["wallets"]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {wallets.map((w) => (
        <Toggle key={w.id} pressed={value === w.id} onPressedChange={() => onChange(w.id)} className="h-10 px-3">
          {w.name}
        </Toggle>
      ))}
    </div>
  );
}
