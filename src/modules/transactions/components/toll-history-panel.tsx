"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppSelect } from "@/components/app/app-select";
import { AMOUNT, CARD_TITLE } from "@/components/app/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AttachmentInput } from "@/modules/receipts/types/attachment";
import type { TollTap } from "@/modules/receipts/types/receipt";
import { formatDateLong } from "@/modules/shared/lib/date";
import { formatRupiah, sum } from "@/modules/shared/lib/money";
import { useCreateTransactions, useTransactionList } from "../hooks/use-transactions";
import { recordedTollKeys, tollKey } from "../lib/toll";
import type { TransactionReference } from "../queries/views";

interface TollHistoryPanelProps {
  reference: TransactionReference;
  /** Dompet yang boleh dipakai (cakupan pemegang dompet). */
  sourceWallets: TransactionReference["wallets"];
  taps: TollTap[];
  attachments: AttachmentInput[];
  initialWalletId: string;
  initialVehicleId: string | null;
  onCancel: () => void;
  onSaved: () => void;
}

/** Screenshot riwayat e-toll → satu pengeluaran Tol per tap (spec riwayat tol). Tap yang sudah tercatat tidak dicentang. */
export function TollHistoryPanel({ reference, sourceWallets, taps, attachments, initialWalletId, initialVehicleId, onCancel, onSaved }: TollHistoryPanelProps) {
  const projectId = reference.project.id;
  const save = useCreateTransactions(projectId);
  const { data: existing } = useTransactionList(projectId);
  const expenseCategories = reference.categories.filter((c) => c.kind === "expense" && !c.isAdminFee && !c.archived);
  const tolCategory = expenseCategories.find((c) => c.name.toLowerCase() === "tol");
  const [categoryId, setCategoryId] = useState<string | null>(tolCategory?.id ?? null);
  // Dompet form sudah e-toll → itu; belum, dan hanya ada satu dompet e-toll → yang itu (beserta mobilnya).
  const flazzWallets = sourceWallets.filter((w) => w.kind === "flazz");
  const formWallet = sourceWallets.find((w) => w.id === initialWalletId);
  const startWallet = formWallet?.kind === "flazz" ? formWallet : flazzWallets.length === 1 ? flazzWallets[0] : formWallet;
  const [vehicleId, setVehicleId] = useState<string | null>(initialVehicleId ?? startWallet?.vehicleId ?? null);
  const [walletId, setWalletId] = useState(startWallet?.id ?? initialWalletId);
  // Centang pilihan pengguna; tanpa pilihan → dicentang kecuali sudah tercatat.
  const [picked, setPicked] = useState<ReadonlyMap<number, boolean>>(new Map());
  // Dibekukan saat Simpan: setelah sukses daftar transaksi dimuat ulang sebelum pindah halaman, jangan sampai semua tap berkedip "Sudah tercatat".
  const [frozen, setFrozen] = useState<ReadonlySet<string> | null>(null);

  const category = expenseCategories.find((c) => c.id === categoryId);
  const needsVehicle = !!category?.isVehicleRelated && reference.vehicles.length > 0;
  const recorded = frozen ?? recordedTollKeys(existing ?? [], walletId);
  const busy = save.isPending || save.isSuccess;
  const isChecked = (index: number) => picked.get(index) ?? !recorded.has(tollKey(taps[index]));
  const selected = taps.filter((_, i) => isChecked(i));
  const total = sum(selected.map((t) => t.amount));
  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const firstError = Object.entries(fieldErrors)[0];
  const errorMessage = firstError ? `Baris ${Number(firstError[0].split(".")[1]) + 1}: ${firstError[1][0]}` : save.error?.message;

  function chooseVehicle(id: string | null) {
    setVehicleId(id);
    const flazz = sourceWallets.find((w) => w.kind === "flazz" && w.vehicleId === id);
    if (flazz) setWalletId(flazz.id);
  }

  function submit() {
    setFrozen(recorded);
    save.mutate(
      selected.map((tap) => ({
        type: "expense" as const,
        date: tap.date,
        time: tap.time,
        amount: tap.amount,
        categoryId,
        walletId,
        toWalletId: null,
        adminFee: 0,
        vehicleId: needsVehicle ? vehicleId : null,
        merchant: "Tol",
        note: "",
        attachments,
      })),
      {
        onError: () => setFrozen(null),
        onSuccess: (saved) => {
          toast.success(`${saved.length} transaksi tol disimpan.`);
          onSaved();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Riwayat tol</CardTitle>
        <CardDescription>Terbaca {taps.length} tap tol. Top Up tidak ikut dicatat.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!tolCategory && (
          <Field>
            <FieldLabel htmlFor="toll-category">Kategori</FieldLabel>
            <AppSelect id="toll-category" value={categoryId ?? ""} items={expenseCategories.map((c) => ({ value: c.id, label: c.name }))} onChange={setCategoryId} />
          </Field>
        )}
        {needsVehicle && (
          <Field>
            <FieldLabel>Mobil</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {reference.vehicles.map((v) => (
                <Toggle key={v.id} pressed={vehicleId === v.id} onPressedChange={(pressed) => chooseVehicle(pressed ? v.id : null)} className="h-10 px-3">
                  {v.name}
                </Toggle>
              ))}
            </div>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="toll-wallet">Dompet</FieldLabel>
          <AppSelect id="toll-wallet" value={walletId} items={sourceWallets.map((w) => ({ value: w.id, label: w.name }))} onChange={setWalletId} />
        </Field>

        <ul className="divide-y border-y-2">
          {taps.map((tap, index) => {
            const checked = isChecked(index);
            return (
              <li key={`${tollKey(tap)}-${index}`}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => setPicked((current) => new Map(current).set(index, !checked))}
                  className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm"
                >
                  <span className={cn("flex size-5 shrink-0 items-center justify-center border-2", checked && "bg-primary")}>{checked && <Check className="size-4" />}</span>
                  <span className="flex-1">
                    {formatDateLong(tap.date)} · {tap.time}
                    {recorded.has(tollKey(tap)) && (
                      <Badge variant="outline" className="ml-2">
                        Sudah tercatat
                      </Badge>
                    )}
                  </span>
                  <span className={cn(AMOUNT, !checked && "text-muted-foreground")}>{formatRupiah(tap.amount)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-sm">
          {selected.length} tap · <span className={AMOUNT}>{formatRupiah(total)}</span>
        </p>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button type="button" disabled={!selected.length || !categoryId || (needsVehicle && !vehicleId) || busy} onClick={submit}>
            {busy ? "Menyimpan…" : `Simpan ${selected.length} transaksi`}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Batal, isi manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
