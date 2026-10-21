// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNowTimeWib } from "./use-now-time-wib";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

function Probe() {
  return <span>{useNowTimeWib("00:00")}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T02:15:00Z"));
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("useNowTimeWib", () => {
  it("jam sekarang di browser (bukan nilai server), ikut berjalan", () => {
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe("09:15");
    act(() => {
      vi.setSystemTime(new Date("2026-10-21T02:16:05Z"));
      vi.advanceTimersByTime(15_000);
    });
    expect(container.textContent).toBe("09:16");
  });
});
