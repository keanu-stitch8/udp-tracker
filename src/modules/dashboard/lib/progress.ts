// Progres proyek untuk beranda. Tanggal ISO "YYYY-MM-DD" (WIB), dibandingkan sebagai string.
import { daysInclusive } from "@/modules/shared/lib/date";

export interface ProjectProgress {
  phase: "before" | "during" | "after";
  /** Hari ke-N (1-based); 0 sebelum mulai, totalDays setelah selesai. */
  day: number;
  totalDays: number;
  /** Hari menuju mulai; 0 kecuali phase "before". */
  daysUntil: number;
}

export function projectProgress(startDate: string, endDate: string, today: string): ProjectProgress {
  const totalDays = daysInclusive(startDate, endDate);
  if (today < startDate) return { phase: "before", day: 0, totalDays, daysUntil: daysInclusive(today, startDate) - 1 };
  if (today > endDate) return { phase: "after", day: totalDays, totalDays, daysUntil: 0 };
  return { phase: "during", day: daysInclusive(startDate, today), totalDays, daysUntil: 0 };
}

/** Hari yang sudah berjalan, pembagi rata-rata per hari. */
export function elapsedDays(progress: ProjectProgress): number {
  return progress.day;
}

export function progressLabel(progress: ProjectProgress): string {
  if (progress.phase === "before") return `Mulai ${progress.daysUntil} hari lagi`;
  if (progress.phase === "after") return `Selesai · ${progress.totalDays} hari`;
  return `Hari ke-${progress.day} dari ${progress.totalDays}`;
}
