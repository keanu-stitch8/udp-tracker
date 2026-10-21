"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/app/category-icon";
import { AMOUNT } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/modules/shared/lib/date";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useAdjustBalanceCheck } from "../hooks/use-wallets";
import { defaultAdjustmentCategoryId, describeDifference } from "../lib/balance-check";
import type { WalletDetail } from "../queries/wallets";
import type { BalanceCheck } from "../types/balance-check";

/** Satu baris riwayat cek saldo. "Catat selisih" hanya untuk cek terbaru (`canAdjust`) agar selisih lama tidak tercatat dua kali. */
export function BalanceCheckItem({ check, detail, canAdjust }: { check: BalanceCheck; detail: WalletDetail; canAdjust: boolean }) {
  const adjust = useAdjustBalanceCheck(detail.projectId);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(() => defaultAdjustmentCategoryId(check.difference, detail.wallet, detail.categories) ?? "");
  const kind = check.difference < 0 ? "expense" : "income";
  const options = detail.categories.filter((c) => c.kind === kind && !c.isAdminFee && !c.isOfficeFunding);

  return (
    <li className="flex flex-col gap-2 py-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{formatDateShort(check.date)}</span>
        <span className={cn(AMOUNT, check.difference < 0 && "text-destructive", check.difference > 0 && "text-green-700")}>
          {describeDifference(check.difference)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Asli {formatRupiah(check.actualBalance)} · aplikasi {formatRupiah(check.computedBalance)}
        {check.note ? ` · ${check.note}` : ""}
      </p>
      {check.difference !== 0 &&
        (check.adjustmentId ? (
          <Link href={`/transaksi/${check.adjustmentId}?dari=/lainnya/dompet/${detail.wallet.id}`} className="self-start text-xs underline">
            Selisih sudah dicatat. Lihat transaksi
          </Link>
        ) : !canAdjust ? null : open ? (
          <div className="flex flex-col gap-2 border-2 p-3">
            <p>
              Catat {formatRupiah(Math.abs(check.difference))} sebagai {kind === "expense" ? "pengeluaran" : "pemasukan"}:
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((c) => (
                <Toggle key={c.id} pressed={categoryId === c.id} onPressedChange={() => setCategoryId(c.id)} className="h-9 px-2.5">
                  <CategoryIcon name={c.icon} className="size-4" />
                  {c.name}
                </Toggle>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={adjust.isPending || !categoryId || detail.locked}
                onClick={() =>
                  adjust.mutate(
                    { checkId: check.id, categoryId },
                    {
                      onSuccess: () => {
                        toast.success("Selisih dicatat sebagai transaksi.");
                        setOpen(false);
                      },
                      onError: (error) => toast.error(error.message),
                    },
                  )
                }
              >
                {adjust.isPending ? "Mencatat…" : "Catat"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="self-start" disabled={detail.locked} onClick={() => setOpen(true)}>
            Catat selisih
          </Button>
        ))}
    </li>
  );
}
