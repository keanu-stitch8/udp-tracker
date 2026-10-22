import { describe, expect, it } from "vitest";
import { elapsedDays, progressLabel, projectProgress } from "./progress";

describe("projectProgress", () => {
  const start = "2026-10-20";
  const end = "2026-10-24";
  it("sebelum mulai", () => {
    const p = projectProgress(start, end, "2026-10-18");
    expect(p).toEqual({ phase: "before", day: 0, totalDays: 5, daysUntil: 2 });
    expect(elapsedDays(p)).toBe(0);
    expect(progressLabel(p)).toBe("Mulai 2 hari lagi");
  });
  it("hari pertama dan tengah", () => {
    expect(progressLabel(projectProgress(start, end, "2026-10-20"))).toBe("Hari ke-1 dari 5");
    const p = projectProgress(start, end, "2026-10-22");
    expect(p).toEqual({ phase: "during", day: 3, totalDays: 5, daysUntil: 0 });
    expect(elapsedDays(p)).toBe(3);
    expect(progressLabel(p)).toBe("Hari ke-3 dari 5");
  });
  it("setelah selesai", () => {
    const p = projectProgress(start, end, "2026-10-30");
    expect(p).toEqual({ phase: "after", day: 5, totalDays: 5, daysUntil: 0 });
    expect(elapsedDays(p)).toBe(5);
    expect(progressLabel(p)).toBe("Selesai · 5 hari");
  });
});
