"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BudgetBar } from "@/components/app/budget-bar";
import { AMOUNT, CARD_TITLE } from "@/components/app/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useBudgetSettings, useDeleteBudget } from "../hooks/use-budgets";
import { BASIS_LABELS } from "../lib/basis";
import { hasEmployeeRate } from "../lib/budget";
import { BudgetForm } from "./budget-form";
import { BudgetTotalCard } from "./budget-total-card";
import { OverBudgetNote } from "./over-budget-note";

type Editing = { kind: "new" } | { kind: "edit"; id: string } | null;

export function BudgetSettingsList({ projectId }: { projectId: string }) {
  const { data } = useBudgetSettings(projectId);
  const remove = useDeleteBudget(projectId);
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  if (!data) return null;
  const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-4">
      {data.locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Pagu dikunci. Buka kembali proyek untuk mengubah.</AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-muted-foreground">
        Batas biaya per pos ({data.context.pax} orang, {data.context.vehicleCount} mobil, periode {data.context.days} hari). Jumlah hari bisa diatur per pagu.
      </p>

      {editing?.kind === "new" ? (
        <Card>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>Pagu baru</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetForm settings={data} onDone={() => setEditing(null)} />
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "new" })}>
          + Tambah pagu
        </Button>
      )}

      {data.budgets.length > 0 && <BudgetTotalCard total={data.total} />}

      {!data.budgets.length && editing?.kind !== "new" && (
        <p className="border-2 border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada pagu. Tambahkan pagu sesuai anggaran proyek, mis. makan per orang per hari.</p>
      )}

      {data.budgets.map((budget) =>
        editing?.kind === "edit" && editing.id === budget.id ? (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle className={CARD_TITLE}>Ubah {budget.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetForm settings={data} initial={budget} onDone={() => setEditing(null)} />
            </CardContent>
          </Card>
        ) : (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle className={CARD_TITLE}>{budget.name}</CardTitle>
              <CardDescription>
                {hasEmployeeRate(budget) && `Karyawan ${formatRupiah(budget.employeeRate!)} · management `}
                {formatRupiah(budget.rate)} {BASIS_LABELS[budget.basis]}
              </CardDescription>
              <CardAction>
                <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "edit", id: budget.id })}>
                  Ubah
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {hasEmployeeRate(budget) && (
                <p>
                  Karyawan: {budget.employeeFormula} = <span className={AMOUNT}>{formatRupiah(budget.employeeLimit)}</span>
                </p>
              )}
              <p>
                {hasEmployeeRate(budget) && "Management: "}
                {budget.formula} = <span className={AMOUNT}>{formatRupiah(budget.limit)}</span>
              </p>
              <BudgetBar used={budget.used} limit={budget.employeeLimit} />
              <p className="text-muted-foreground">Terpakai {formatRupiah(budget.used)}</p>
              {budget.employeeRate === null && <p className="text-muted-foreground">Tidak terlihat oleh anggota (tarif karyawan kosong).</p>}
              <OverBudgetNote used={budget.used} limit={budget.employeeLimit} managementLimit={budget.limit} />
              <div className="flex flex-wrap gap-1">
                {budget.categoryIds.map((id) => (
                  <Badge key={id} variant="outline">
                    {categoryName.get(id) ?? "?"}
                  </Badge>
                ))}
              </div>
              {confirmDelete === budget.id ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(budget.id, {
                        onSuccess: () => {
                          toast(`${budget.name} dihapus.`);
                          setConfirmDelete(null);
                        },
                        onError: (error) => toast.error(error.message),
                      })
                    }
                  >
                    Ya, hapus {budget.name}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="self-start text-destructive" disabled={data.locked} onClick={() => setConfirmDelete(budget.id)}>
                  Hapus pagu
                </Button>
              )}
            </CardContent>
          </Card>
        ),
      )}

    </div>
  );
}

