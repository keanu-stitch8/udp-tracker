"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { AMOUNT, CARD_TITLE, LABEL } from "@/components/app/typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/modules/shared/lib/money";
import { useAnimatedNumber } from "../hooks/use-animated-number";
import { gaugeSegments, type UdpBreakdown } from "../lib/category-share";

// Warna per grup bergilir: [busur gauge, kotak legenda].
const TONES = [
  ["stroke-chart-1", "bg-chart-1"],
  ["stroke-chart-2", "bg-chart-2"],
  ["stroke-chart-3", "bg-chart-3"],
  ["stroke-chart-5", "bg-chart-5"],
  ["stroke-accent", "bg-accent"],
  ["stroke-muted-foreground", "bg-muted-foreground"],
] as const;
// Setengah lingkaran r = 80; `pathLength` 100 → panjang dash = persen busur.
const ARC = "M 20 100 A 80 80 0 0 1 180 100";

const percent = (share: number | null) => (share === null ? "" : ` · ${share}%`);
const REMAINING = "sisa";
// Kotak baris (grup + kategorinya) = area tap/hover; border transparan saat tidak aktif agar tata letak tidak bergeser.
const itemBox = (on: boolean, selectable: boolean) =>
  cn(
    "-mx-2 border-2 px-2 py-1 transition-[opacity,box-shadow,border-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
    on ? "border-border shadow-sm" : "border-transparent",
    selectable && "cursor-pointer hover:border-border",
  );

/**
 * Pengeluaran per grup (struktur RAB) sebagai bagian dari UDP diterima: gauge bersegmen per grup + sisa, total 100%.
 * Tap grup / Sisa UDP → baris diberi kotak, segmen lain meredup, angka tengah bergulir ke persen pilihan;
 * tap lagi atau di luar baris → kembali ke UDP terpakai.
 */
export function GroupBreakdown({ data }: { data: UdpBreakdown }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = active === REMAINING ? { name: "Sisa UDP", share: data.remainingShare } : data.groups.find((g) => g.key === active);
  const centerShare = selected ? selected.share : data.usedShare;
  const animated = useAnimatedNumber(centerShare ?? 0);
  useEffect(() => {
    if (active === null) return;
    const reset = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.("[data-gauge-item]")) setActive(null);
    };
    document.addEventListener("pointerdown", reset);
    return () => document.removeEventListener("pointerdown", reset);
  }, [active]);
  if (!data.groups.length && data.received <= 0) return null;
  const over = data.overBy > 0;
  const segments = gaugeSegments(data);
  const selectable = data.usedShare !== null;
  const toggle = (key: string) => setActive((current) => (current === key ? null : key));
  const dimmed = (key: string) => selected !== undefined && active !== key;
  // Div ber-role button (bukan <button>) karena kotak grup memuat daftar kategori.
  const itemProps = (key: string) => ({
    role: "button",
    tabIndex: selectable ? 0 : -1,
    "aria-pressed": active === key,
    "aria-disabled": !selectable,
    "data-gauge-item": true,
    onClick: () => selectable && toggle(key),
    onKeyDown: (event: KeyboardEvent) => {
      if (!selectable || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      toggle(key);
    },
    className: cn(itemBox(active === key, selectable), dimmed(key) && "opacity-50"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_TITLE}>Pengeluaran per grup</CardTitle>
        {data.received > 0 && <CardDescription>Dari UDP diterima {formatRupiah(data.received)}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <div className="mb-3 flex flex-col items-center gap-2">
          <div className="relative w-full max-w-[280px]">
            <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
              <path d={ARC} fill="none" strokeWidth={24} className={over ? "stroke-destructive" : "stroke-foreground"} />
              <path d={ARC} fill="none" strokeWidth={18} className="stroke-background" />
              {segments.map((s, i) => (
                <path
                  key={s.key}
                  d={ARC}
                  fill="none"
                  strokeWidth={18}
                  pathLength={100}
                  strokeDasharray={`${s.length} 100`}
                  strokeDashoffset={-s.start}
                  className={cn(TONES[i % TONES.length][0], "transition-opacity duration-300", dimmed(s.key) && "opacity-20")}
                />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
              <span className={cn(AMOUNT, "text-3xl leading-none tabular-nums", over && !selected && "text-destructive")}>{centerShare === null ? "—" : `${animated}%`}</span>
              <span className="mt-1 max-w-[60%] truncate text-xs text-muted-foreground">{selected?.name ?? "UDP terpakai"}</span>
            </div>
          </div>
          {data.received <= 0 ? (
            <p className="text-muted-foreground">Belum ada UDP diterima.</p>
          ) : over ? (
            <p className="text-center text-destructive">Lebih {formatRupiah(data.overBy)} dari UDP (perlu reimburse)</p>
          ) : (
            <p className="text-muted-foreground">
              Sisa UDP <span className={cn(AMOUNT, "text-foreground")}>{formatRupiah(data.remaining)}</span>
            </p>
          )}
        </div>

        {data.groups.map((g, i) => (
          <div key={g.key} {...itemProps(g.key)}>
            <div className="flex min-h-7 items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("size-3 shrink-0 border-2", TONES[i % TONES.length][1])} />
                <span className={`${LABEL} truncate`}>{g.name}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {formatRupiah(g.amount)}
                <span className="font-normal text-muted-foreground">{percent(g.share)}</span>
              </span>
            </div>
            <ul className="flex flex-col gap-0.5 pl-5 text-xs text-muted-foreground">
              {g.categories.map((c) => (
                <li key={c.key} className="flex justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatRupiah(c.amount)}
                    {percent(c.share)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {data.received > 0 && !over && (
          <div className="mt-2 border-t-2 pt-2">
            <div {...itemProps(REMAINING)}>
              <div className="flex min-h-7 items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="size-3 shrink-0 border-2 bg-background" />
                  <span className={LABEL}>Sisa UDP</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatRupiah(data.remaining)}
                  <span className="font-normal text-muted-foreground">{percent(data.remainingShare)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
