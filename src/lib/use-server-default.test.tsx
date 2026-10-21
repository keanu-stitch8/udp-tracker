// @vitest-environment happy-dom
import { act, useImperativeHandle, type Ref } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useServerDefault } from "./use-server-default";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Handle {
  value: string;
  isDefault: boolean;
  set: (value: string) => void;
}

function Probe({ initial, serverDefault, handle }: { initial?: string; serverDefault: string; handle: Ref<Handle> }) {
  const [value, set, isDefault] = useServerDefault(initial, serverDefault);
  useImperativeHandle(handle, () => ({ value, isDefault, set }), [value, isDefault, set]);
  return null;
}

let root: Root;
const handle: { current: Handle | null } = { current: null };
const render = (serverDefault: string, initial?: string) => act(() => root.render(<Probe initial={initial} serverDefault={serverDefault} handle={handle} />));

beforeEach(() => {
  root = createRoot(document.createElement("div"));
});
afterEach(() => act(() => root.unmount()));

describe("useServerDefault", () => {
  it("selama belum diubah, ikut default terbaru dari server (state form dipertahankan Activity)", async () => {
    await render("00:23");
    expect(handle.current).toMatchObject({ value: "00:23", isDefault: true });
    await render("00:24");
    expect(handle.current).toMatchObject({ value: "00:24", isDefault: true });
  });

  it("setelah diubah, nilai tetap walau default server berubah", async () => {
    await render("00:23");
    await act(() => handle.current!.set("14:30"));
    await render("00:25");
    expect(handle.current).toMatchObject({ value: "14:30", isDefault: false });
  });

  it("nilai awal (form ubah) bukan default", async () => {
    await render("00:23", "09:00");
    expect(handle.current).toMatchObject({ value: "09:00", isDefault: false });
  });
});
