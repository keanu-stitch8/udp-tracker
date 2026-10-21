"use client";

import { Minus, Plus } from "lucide-react";
import { useRef, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const digits = (raw: string) => raw.replace(/\D/g, "").slice(0, 2);
const pad = (part: string) => (part.length === 1 ? `0${part}` : part);
/** +/- berputar: 23 → 00 untuk jam, 59 → 00 untuk menit. */
const step = (part: string, delta: number, max: number) => String(((part === "" ? 0 : Number(part)) + delta + max + 1) % (max + 1)).padStart(2, "0");

const STEP_CLASS = "flex flex-1 cursor-pointer items-center justify-center hover:bg-accent active:bg-primary disabled:pointer-events-none";

interface PartProps {
  id?: string;
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  /** Dipanggil saat pengguna selesai mengetik 2 digit (bukan dari +/-). */
  onFilled?: () => void;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/** Satu kotak 2 digit + tombol +/- bertumpuk di kanan; tinggi total sama dengan tombol DatePicker (h-11). */
function TimePart({ id, label, value, max, onChange, onFilled, disabled, ref }: PartProps) {
  return (
    <div className="flex h-11 overflow-hidden rounded border-2 bg-input shadow-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
      <Input
        ref={ref}
        id={id}
        aria-label={label}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="00"
        maxLength={2}
        disabled={disabled}
        className="h-full w-10 rounded-none border-0 px-0 text-center text-base tabular-nums shadow-none focus-visible:outline-none"
        value={value}
        onChange={(event) => {
          const next = digits(event.target.value);
          onChange(next);
          if (next.length === 2) onFilled?.();
        }}
        onBlur={() => onChange(pad(value))}
      />
      <div className="flex w-7 flex-col border-l-2">
        <button type="button" tabIndex={-1} aria-label={`Tambah ${label.toLowerCase()}`} disabled={disabled} className={STEP_CLASS} onClick={() => onChange(step(value, 1, max))}>
          <Plus className="size-3.5" />
        </button>
        <button type="button" tabIndex={-1} aria-label={`Kurangi ${label.toLowerCase()}`} disabled={disabled} className={cn(STEP_CLASS, "border-t-2")} onClick={() => onChange(step(value, -1, max))}>
          <Minus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

interface TimeInputProps {
  id?: string;
  /** "HH:mm"; kosong = "". */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Jam 24 jam dalam dua kotak (jam, menit), bukan `type="time"` yang tampil AM/PM bila HP disetel 12 jam. */
export function TimeInput({ id, value, onChange, className, disabled }: TimeInputProps) {
  const minuteRef = useRef<HTMLInputElement>(null);
  const [hour = "", minute = ""] = value.split(":");
  const set = (h: string, m: string) => onChange(h || m ? `${h}:${m}` : "");

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <TimePart
        id={id}
        label="Jam"
        value={hour}
        max={23}
        disabled={disabled}
        onChange={(next) => set(next, minute)}
        onFilled={() => minuteRef.current?.focus()}
      />
      <span aria-hidden className="font-head text-lg font-bold">
        :
      </span>
      <TimePart ref={minuteRef} label="Menit" value={minute} max={59} disabled={disabled} onChange={(next) => set(hour, next)} />
    </div>
  );
}
