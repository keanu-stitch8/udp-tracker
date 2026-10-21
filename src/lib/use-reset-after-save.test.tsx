// @vitest-environment happy-dom
import { Activity, act, useImperativeHandle, type Ref } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useResetAfterSave } from "./use-reset-after-save";

// Simulasi Cache Components: halaman yang ditinggalkan disembunyikan dengan <Activity>, bukan dibongkar.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Handle {
  resetKey: number;
  markSaved: () => void;
}

function Probe({ handle }: { handle: Ref<Handle> }) {
  const { resetKey, resetWhenHidden } = useResetAfterSave();
  useImperativeHandle(handle, () => ({ resetKey, markSaved: resetWhenHidden }), [resetKey, resetWhenHidden]);
  return null;
}

let root: Root;
const handle: { current: Handle | null } = { current: null };
const render = (mode: "visible" | "hidden") =>
  act(() =>
    root.render(
      <Activity mode={mode}>
        <Probe handle={handle} />
      </Activity>,
    ),
  );

beforeEach(() => {
  root = createRoot(document.createElement("div"));
});
afterEach(() => act(() => root.unmount()));

describe("useResetAfterSave", () => {
  it("draf tanpa simpan dipertahankan saat halaman disembunyikan lalu ditampilkan lagi", async () => {
    await render("visible");
    await render("hidden");
    await render("visible");
    expect(handle.current?.resetKey).toBe(0);
  });

  it("setelah simpan sukses, form di-reset saat halaman disembunyikan — sekali saja", async () => {
    await render("visible");
    act(() => handle.current!.markSaved());
    expect(handle.current?.resetKey).toBe(0); // tidak berkedip kosong sebelum navigasi
    await render("hidden");
    await render("visible");
    expect(handle.current?.resetKey).toBe(1);
    await render("hidden");
    await render("visible");
    expect(handle.current?.resetKey).toBe(1);
  });
});
