import { describe, expect, it, vi } from "vitest";
import { gcall } from "./gcall";

const rateLimited = Object.assign(new Error("Rate limit exceeded"), { status: 429 });

describe("gcall", () => {
  it("rate limit → coba ulang dengan jeda bertambah, lalu berhasil", async () => {
    const fn = vi.fn().mockRejectedValueOnce(rateLimited).mockRejectedValueOnce(rateLimited).mockResolvedValue("ok");
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(gcall(fn, { sleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    const [first, second] = sleep.mock.calls.map(([ms]) => ms as number);
    expect(first).toBeGreaterThanOrEqual(2000);
    expect(second).toBeGreaterThanOrEqual(4000);
  });

  it("error lain langsung dilempar; batas percobaan dihormati", async () => {
    const denied = Object.assign(new Error("insufficient permissions"), { status: 403 });
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(gcall(vi.fn().mockRejectedValue(denied), { sleep })).rejects.toBe(denied);
    expect(sleep).not.toHaveBeenCalled();
    const always = vi.fn().mockRejectedValue(rateLimited);
    await expect(gcall(always, { sleep, attempts: 3 })).rejects.toBe(rateLimited);
    expect(always).toHaveBeenCalledTimes(3);
  });
});
