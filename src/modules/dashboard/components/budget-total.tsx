import { BudgetBar } from "@/components/app/budget-bar";
import { Card, CardContent } from "@/components/ui/card";
import { OverBudgetNote } from "@/modules/budgets/components/over-budget-note";
import type { BudgetTotal, BudgetUsage } from "@/modules/budgets/types/budget";
import { formatRupiah } from "@/modules/shared/lib/money";

function BudgetLine({ name, used, limit }: { name: string; used: number; limit: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2">
        <span>{name}</span>
        <span className="tabular-nums">
          {formatRupiah(used)} / {formatRupiah(limit)}
        </span>
      </div>
      <BudgetBar used={used} limit={limit} />
      <OverBudgetNote used={used} limit={limit} />
    </div>
  );
}

/** Pagu management (Root/PM): total lalu rincian per pagu, tampilan sama dengan pagu di detail hari kalender. */
export function BudgetTotalTile({ total, items }: { total: BudgetTotal; items: BudgetUsage[] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-3 text-sm">
        <BudgetLine name="Total pagu" used={total.used} limit={total.limit} />
        {items.length > 1 && (
          <div className="flex flex-col gap-3 border-t-2 pt-3">
            {items.map((b) => (
              <BudgetLine key={b.budgetId} name={b.name} used={b.used} limit={b.limit} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
