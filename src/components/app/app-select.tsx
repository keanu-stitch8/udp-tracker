"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppSelectProps<T extends string> {
  id?: string;
  label?: string;
  value: T;
  items: { value: T; label: string }[];
  onChange: (value: T) => void;
}

// Select dengan popup turun di bawah trigger (tidak menimpa) dan selebar trigger.
// `items` juga dipakai Base UI untuk menampilkan label terpilih di trigger.
export function AppSelect<T extends string>({ id, label, value, items, onChange }: AppSelectProps<T>) {
  return (
    <Select items={items} value={value} onValueChange={(next) => next !== null && onChange(next)}>
      <SelectTrigger id={id} aria-label={label} className="w-full data-[size=default]:h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="min-w-(--anchor-width)">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
