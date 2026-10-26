import { useEffect, useRef, useState } from "react";

/** Angka yang bergulir (ease-out) ke `target` setiap kali berubah; langsung lompat bila pengguna memilih kurangi gerak. */
export function useAnimatedNumber(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const from = shown.current;
    const ms = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let start: number | null = null;
    let frame = 0;
    const step = (now: number) => {
      start ??= now;
      const progress = ms > 0 ? Math.min((now - start) / ms, 1) : 1;
      shown.current = Math.round(from + (target - from) * (1 - (1 - progress) ** 3));
      setValue(shown.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
