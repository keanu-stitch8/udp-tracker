import { CARD_TITLE, LABEL } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatRupiah } from "@/modules/shared/lib/money";
import type { GroupShare } from "../lib/category-share";

// Warna bar bergilir; komponen ui tidak diedit → warna indikator diatur dari luar lewat data-slot.
const BAR_TONES = [
  "[&_[data-slot=progress-indicator]]:bg-chart-1",
  "[&_[data-slot=progress-indicator]]:bg-chart-2",
  "[&_[data-slot=progress-indicator]]:bg-chart-3",
  "[&_[data-slot=progress-indicator]]:bg-chart-5",
  "[&_[data-slot=progress-indicator]]:bg-accent",
  "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
];

/** Pengeluaran per grup (struktur RAB): bar per grup, rincian kategori sebagai teks. */
export function GroupBreakdown({ groups }: { groups: GroupShare[] }) {
  if (!groups.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Pengeluaran per grup</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {groups.map((g, i) => (
          <div key={g.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={`${LABEL} truncate`}>{g.name}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatRupiah(g.amount)} <span className="font-normal text-muted-foreground">· {g.share}%</span>
              </span>
            </div>
            <Progress value={g.share} aria-label={g.name} className={BAR_TONES[i % BAR_TONES.length]} />
            <ul className="flex flex-col gap-0.5 pl-2 text-xs text-muted-foreground">
              {g.categories.map((c) => (
                <li key={c.key} className="flex justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatRupiah(c.amount)} · {c.share}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
