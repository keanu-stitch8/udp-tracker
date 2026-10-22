"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppSelectProps<T extends string> {
  id?: string;
  label?: string;
  value: T;
  /** `group`: judul kelompok opsi; opsi berurutan dengan group sama dikumpulkan. Tanpa group → tampil tanpa judul. */
  items: { value: T; label: string; group?: string }[];
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
        {sectionsOf(items).map((section, i) => {
          const options = section.items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ));
          return section.group ? (
            <SelectGroup key={`${section.group}-${i}`}>
              <SelectLabel>{section.group}</SelectLabel>
              {options}
            </SelectGroup>
          ) : (
            options
          );
        })}
      </SelectContent>
    </Select>
  );
}

function sectionsOf<I extends { group?: string }>(items: I[]): { group?: string; items: I[] }[] {
  const sections: { group?: string; items: I[] }[] = [];
  for (const item of items) {
    const last = sections.at(-1);
    if (last && last.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }
  return sections;
}
