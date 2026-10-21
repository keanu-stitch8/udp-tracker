"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { parseRupiah } from "@/modules/shared/lib/money";

const idNumber = new Intl.NumberFormat("id-ID");

type MoneyInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

/** Input nominal rupiah: keypad angka, tampil "1.350.000", nilai integer. */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={className ? `pl-10 ${className}` : "pl-10"}
        value={value === null ? "" : idNumber.format(value)}
        onChange={(event) => onChange(parseRupiah(event.target.value))}
      />
    </div>
  );
}
