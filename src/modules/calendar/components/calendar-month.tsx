"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CARD_TITLE, LABEL, PAGE_TITLE } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/modules/shared/lib/date";
import { formatRupiahCompact } from "@/modules/shared/lib/money";
import { useCalendarMonth } from "../hooks/use-calendar";
import { formatMonthLabel, monthGrid, shiftMonth } from "../lib/month";
import { DayDetailPanel } from "./day-detail";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface CalendarMonthProps {
  projectId: string;
  initialMonth: string;
  today: string;
  startDate: string;
  endDate: string;
}

export function CalendarMonth({ projectId, initialMonth, today, startDate, endDate }: CalendarMonthProps) {
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const { data } = useCalendarMonth(projectId, month);
  const totals = data?.month === month ? data.totals : {};

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" aria-label="Bulan sebelumnya" onClick={() => setMonth(shiftMonth(month, -1))}>
          <ChevronLeft />
        </Button>
        <h1 className={PAGE_TITLE}>{formatMonthLabel(month)}</h1>
        <Button variant="outline" size="icon" aria-label="Bulan berikutnya" onClick={() => setMonth(shiftMonth(month, 1))}>
          <ChevronRight />
        </Button>
      </div>

      <div aria-label={formatMonthLabel(month)} className="grid grid-cols-7 border-2 bg-card shadow-md">
        {WEEKDAYS.map((day) => (
          <div key={day} aria-hidden className={`border-b-2 py-1 text-center ${LABEL}`}>
            {day}
          </div>
        ))}
        {monthGrid(month)
          .flat()
          .map((cell) => {
            const total = totals[cell.date] ?? 0;
            const inProject = cell.date >= startDate && cell.date <= endDate;
            return (
              <button
                key={cell.date}
                type="button"
                aria-label={`${formatDateShort(cell.date)}${total ? `, keluar ${formatRupiahCompact(total)}` : ""}`}
                onClick={() => setSelected(cell.date)}
                className={cn(
                  "flex min-h-16 flex-col items-start gap-0.5 border-r border-b p-1 text-left [&:nth-child(7n)]:border-r-0",
                  !cell.inMonth && "text-muted-foreground opacity-50",
                  inProject && "bg-accent",
                  selected === cell.date && "outline-2 -outline-offset-2 outline-foreground",
                )}
              >
                <span className={cn("text-xs", cell.date === today && "bg-foreground px-1 font-bold text-background")}>{Number(cell.date.slice(8))}</span>
                {total > 0 && <span className="text-[0.65rem] leading-tight font-medium tabular-nums">{formatRupiahCompact(total)}</span>}
              </button>
            );
          })}
      </div>
      <p className="text-xs text-muted-foreground">Kotak kuning = periode proyek. Angka = total pengeluaran hari itu.</p>

      <Drawer open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent className="mx-auto max-w-[480px]">
          <DrawerHeader>
            <DrawerTitle className={CARD_TITLE}>{selected ? formatDateShort(selected) : ""}</DrawerTitle>
          </DrawerHeader>
          {selected && <DayDetailPanel projectId={projectId} date={selected} onNavigate={() => setSelected(null)} />}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
