import { BudgetBar } from "@/components/app/budget-bar";
import { AMOUNT, CARD_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { DualBudgetTotal } from "../types/budget";
import { OverBudgetNote } from "./over-budget-note";

/** Total semua pagu (Root/PM): pagu karyawan, pagu management, cadangan, dan apakah kelebihan masih tertutup cadangan. */
export function BudgetTotalCard({ total }: { total: DualBudgetTotal }) {
  const dual = total.reserve !== 0;
  const rows: [string, number][] = dual
    ? [
        ["Pagu karyawan", total.employeeLimit],
        ["Pagu management", total.managementLimit],
        ["Cadangan", total.reserve],
        ["Terpakai", total.used],
      ]
    : [
        ["Total pagu", total.managementLimit],
        ["Terpakai", total.used],
      ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Total pagu</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={`${AMOUNT} text-right`}>{formatRupiah(value)}</dd>
            </div>
          ))}
        </dl>
        <BudgetBar used={total.used} limit={total.employeeLimit} />
        <OverBudgetNote used={total.used} limit={total.employeeLimit} managementLimit={total.managementLimit} />
      </CardContent>
    </Card>
  );
}
