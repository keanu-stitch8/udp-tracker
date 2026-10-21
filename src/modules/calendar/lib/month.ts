// Bulan = "YYYY-MM". Grid kalender dimulai Senin (kebiasaan Indonesia).
import { addDays } from "@/modules/shared/lib/date";

const MONTH = /^(\d{4})-(\d{2})$/;

export function isMonth(value: string): boolean {
  const match = MONTH.exec(value);
  return !!match && Number(match[2]) >= 1 && Number(match[2]) <= 12;
}

export const monthOf = (date: string) => date.slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mon - 1 + delta, 1)).toISOString().slice(0, 7);
}

export interface DayCell {
  date: string;
  inMonth: boolean;
}

/** Minggu-minggu (Senin–Minggu) yang mencakup seluruh bulan. */
export function monthGrid(month: string): DayCell[][] {
  const first = `${month}-01`;
  const mondayOffset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const nextMonthStart = `${shiftMonth(month, 1)}-01`;
  const weeks: DayCell[][] = [];
  for (let cursor = addDays(first, -mondayOffset); cursor < nextMonthStart; cursor = addDays(cursor, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(cursor, i);
        return { date, inMonth: monthOf(date) === month };
      }),
    );
  }
  return weeks;
}

/** Bulan yang dibuka pertama kali: bulan hari ini bila masih dalam periode proyek, selain itu bulan terdekat dari periode. */
export function defaultCalendarMonth(today: string, startDate: string, endDate: string): string {
  if (today < startDate) return monthOf(startDate);
  if (today > endDate) return monthOf(endDate);
  return monthOf(today);
}

const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

/** "Oktober 2026" */
export function formatMonthLabel(month: string): string {
  return monthLabel.format(new Date(`${month}-01T00:00:00Z`));
}
