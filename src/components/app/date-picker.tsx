"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { id as localeId } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateLong, isoToLocalDate, localDateToIso } from "@/modules/shared/lib/date";

interface DatePickerProps {
  id?: string;
  /** Tanggal ISO `YYYY-MM-DD`. */
  value: string;
  onChange: (iso: string) => void;
  /** Rentang yang diberi highlight (mis. periode proyek); tanggal di luarnya tetap boleh dipilih. */
  period?: { from: string; to: string };
  className?: string;
  disabled?: boolean;
}

/** Pengganti `<input type="date">` (native iOS meluber dari container): tombol + popover kalender NeoBrutalism. */
export function DatePicker({ id, value, onChange, period, className, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? isoToLocalDate(value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button id={id} type="button" variant="outline" disabled={disabled} className={cn("h-11 w-full justify-start font-sans font-normal", className)}>
            <CalendarDays />
            {value ? formatDateLong(value) : "Pilih tanggal"}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={localeId}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          modifiers={period ? { period: { from: isoToLocalDate(period.from), to: isoToLocalDate(period.to) } } : undefined}
          modifiersClassNames={{ period: "bg-accent/40" }}
          onSelect={(date) => {
            if (!date) return;
            onChange(localDateToIso(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
