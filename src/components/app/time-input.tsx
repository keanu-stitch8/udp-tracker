"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatTimeTyping, normalizeTime } from "@/modules/shared/lib/date";

type TimeInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type" | "inputMode"> & {
  value: string;
  onChange: (value: string) => void;
};

/** Jam "HH:mm" selalu 24 jam: input teks, karena `type="time"` tampil AM/PM bila HP disetel 12 jam. */
export function TimeInput({ value, onChange, onBlur, ...props }: TimeInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="14:30"
      maxLength={5}
      value={value}
      onChange={(event) => onChange(formatTimeTyping(event.target.value))}
      onBlur={(event) => {
        onChange(normalizeTime(value));
        onBlur?.(event);
      }}
    />
  );
}
