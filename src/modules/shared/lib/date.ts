// Tanggal transaksi = string "YYYY-MM-DD" dalam WIB (spec §3). Aritmetika memakai UTC agar bebas zona waktu mesin.
import { z } from "zod";

export const WIB = "Asia/Jakarta";
const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const wibDate = new Intl.DateTimeFormat("en-CA", { timeZone: WIB });

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
export function todayWib(now: Date = new Date()): string {
  return wibDate.format(now);
}

function toUtcMs(iso: string): number {
  const [, y, m, d] = ISO_DATE.exec(iso)!;
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const date = new Date(toUtcMs(value));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() + 1 === Number(match[2]) && date.getUTCDate() === Number(match[3]);
}

export const isoDateSchema = z.string().refine(isIsoDate, "Tanggal tidak valid.");

/** Jumlah hari dari start s/d end, inklusif (20–25 Okt = 6 hari). */
export function daysInclusive(start: string, end: string): number {
  return Math.round((toUtcMs(end) - toUtcMs(start)) / DAY_MS) + 1;
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

const shortFormat = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "Sel, 20 Okt" */
export function formatDateShort(iso: string): string {
  return shortFormat.format(new Date(toUtcMs(iso)));
}

/** "20 Okt 2026" */
export function formatDateLong(iso: string): string {
  return longFormat.format(new Date(toUtcMs(iso)));
}

/** Untuk komponen kalender: tanggal ISO sebagai Date lokal browser (tengah malam), tanpa geser hari karena zona waktu. */
export function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
