// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedNumber } from "./use-animated-number";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

function Probe({ target }: { target: number }) {
  return <span>{useAnimatedNumber(target, 600)}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("useAnimatedNumber", () => {
  it("mulai dari target awal, lalu bergulir naik dan turun ke target baru", () => {
    act(() => root.render(<Probe target={20} />));
    expect(container.textContent).toBe("20");

    act(() => root.render(<Probe target={80} />));
    act(() => vi.advanceTimersByTime(200));
    const mid = Number(container.textContent);
    expect(mid).toBeGreaterThan(20);
    expect(mid).toBeLessThan(80);
    act(() => vi.advanceTimersByTime(600));
    expect(container.textContent).toBe("80");

    act(() => root.render(<Probe target={10} />));
    act(() => vi.advanceTimersByTime(200));
    expect(Number(container.textContent)).toBeLessThan(80);
    act(() => vi.advanceTimersByTime(600));
    expect(container.textContent).toBe("10");
  });
});
