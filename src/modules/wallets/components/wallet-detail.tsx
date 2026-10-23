"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { MoneyInput } from "@/components/app/money-input";
import { AMOUNT, CARD_TITLE, LABEL } from "@/components/app/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useCreateBalanceCheck, useSaveWallet, useWalletDetail } from "../hooks/use-wallets";
import { describeDifference } from "../lib/balance-check";
import { balanceAt } from "../lib/balances";
import { WALLET_KIND_LABELS } from "../lib/kinds";
import { reimburseStatus } from "../lib/reimburse";
import type { WalletDetail } from "../queries/wallets";
import { BalanceCheckItem } from "./balance-check-item";
import { WalletForm } from "./wallet-form";

/** `canManage` (Root/PM): ubah & arsipkan dompet. Anggota tetap bisa cek saldo. */
export function WalletDetailPanel({ projectId, walletId, today, canManage }: { projectId: string; walletId: string; today: string; canManage: boolean }) {
  const { data } = useWalletDetail(projectId, walletId);
  const save = useSaveWallet(projectId, walletId);
  const [editing, setEditing] = useState(false);
  if (!data) return null;
  const { wallet } = data;

  function toggleArchived() {
    const archived = !wallet.archived;
    save.mutate(
      { kind: wallet.kind, name: wallet.name, holder: wallet.holder, vehicleId: wallet.vehicleId, openingBalance: wallet.openingBalance, archived },
      {
        onSuccess: () => toast(archived ? "Dompet diarsipkan. Tidak muncul lagi di form transaksi." : "Dompet diaktifkan lagi."),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Dompet dan cek saldo dikunci. Buka kembali proyek untuk mengubah.</AlertDescription>
        </Alert>
      )}

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>Ubah {wallet.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <WalletForm projectId={projectId} vehicles={data.vehicles} initial={wallet} onDone={() => setEditing(false)} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>{wallet.name}</CardTitle>
            <CardDescription>{[WALLET_KIND_LABELS[wallet.kind], wallet.vehicleName, wallet.holder].filter(Boolean).join(" · ")}</CardDescription>
            {canManage && (
              <CardAction>
                <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing(true)}>
                  Ubah
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className={`${LABEL} text-muted-foreground`}>{wallet.kind === "reimburse" ? "Status reimburse" : "Saldo di aplikasi"}</p>
              {wallet.kind === "reimburse" ? (
                <p className="font-head text-2xl font-bold">{reimburseStatus(wallet.balance)}</p>
              ) : (
                <p className={cn(AMOUNT, "text-3xl", wallet.balance < 0 && "text-destructive")}>{formatRupiah(wallet.balance)}</p>
              )}
              <p className="text-xs text-muted-foreground">Saldo awal {formatRupiah(wallet.openingBalance)}</p>
            </div>
            <div className="flex items-center gap-2">
              {wallet.archived && <Badge variant="outline">Diarsipkan</Badge>}
              {canManage && (
                <Button size="sm" variant="ghost" disabled={data.locked || save.isPending} onClick={toggleArchived}>
                  {wallet.archived ? "Aktifkan lagi" : "Arsipkan dompet"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <BalanceCheckForm detail={data} today={today} />

      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Riwayat cek saldo</CardTitle>
        </CardHeader>
        <CardContent>
          {data.checks.length ? (
            <ul className="divide-y">
              {data.checks.map((check, index) => (
                <BalanceCheckItem key={check.id} check={check} detail={data} canAdjust={index === 0} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Belum pernah cek saldo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCheckForm({ detail, today }: { detail: WalletDetail; today: string }) {
  const create = useCreateBalanceCheck(detail.projectId, detail.wallet.id);
  const [date, setDate] = useState(today);
  const [actual, setActual] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const computed = balanceAt(detail.balanceHistory, detail.wallet.openingBalance, date);
  const fieldErrors = create.error instanceof ApiError ? create.error.fieldErrors : {};
  const errorOf = (field: string) => fieldErrors[field]?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Cek saldo</CardTitle>
        <CardDescription>Masukkan saldo asli (cek kartu Flazz, hitung uang cash, atau lihat saldo rekening) untuk dicocokkan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (actual === null) return;
            create.mutate(
              { date, actualBalance: actual, note },
              {
                onSuccess: (check) => {
                  toast(check.difference === 0 ? "Saldo cocok." : `Cek saldo tersimpan: ${describeDifference(check.difference).toLowerCase()}.`);
                  setActual(null);
                  setNote("");
                },
              },
            );
          }}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={errorOf("date") ? true : undefined}>
                <FieldLabel htmlFor="check-date">Tanggal</FieldLabel>
                <DatePicker id="check-date" className="h-10" value={date} onChange={setDate} />
                {errorOf("date") && <FieldError>{errorOf("date")}</FieldError>}
              </Field>
              <Field data-invalid={errorOf("actualBalance") ? true : undefined}>
                <FieldLabel htmlFor="check-actual">Saldo asli</FieldLabel>
                <MoneyInput id="check-actual" className="h-10" value={actual} onChange={setActual} />
                {errorOf("actualBalance") && <FieldError>{errorOf("actualBalance")}</FieldError>}
              </Field>
            </div>
            <Field data-invalid={errorOf("note") ? true : undefined}>
              <FieldLabel htmlFor="check-note">Catatan</FieldLabel>
              <Input id="check-note" className="h-10" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
              {errorOf("note") && <FieldError>{errorOf("note")}</FieldError>}
            </Field>
          </FieldGroup>
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-muted-foreground">Saldo aplikasi s/d tanggal</dt>
            <dd className={`text-right ${AMOUNT}`}>{formatRupiah(computed)}</dd>
            <dt className="text-muted-foreground">Selisih</dt>
            <dd className={`text-right ${AMOUNT}`}>{actual === null ? "—" : describeDifference(actual - computed)}</dd>
          </dl>
          {create.error && !Object.keys(fieldErrors).length && (
            <p role="alert" className="text-sm text-destructive">
              {create.error.message}
            </p>
          )}
          <Button type="submit" disabled={create.isPending || actual === null || detail.locked}>
            {create.isPending ? "Menyimpan…" : "Simpan cek saldo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
