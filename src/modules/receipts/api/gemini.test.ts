import { afterEach, describe, expect, it, vi } from "vitest";
import { generateJson } from "./gemini";

const ok = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"confident":true}' }] } }] }), { status: 200 });

function sentConfig(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string).generationConfig;
}

afterEach(() => vi.unstubAllGlobals());

describe("generateJson", () => {
  it("Gemini 3+: thinkingLevel minimal (low membuat scan >30 detik, diukur 2026-10-22); Gemini 1/2: tanpa thinkingConfig", async () => {
    const input = { apiKey: "k", prompt: "p", file: { mimeType: "image/jpeg", base64: "AA==" }, schema: {} };
    const fetchMock = vi.fn(async () => ok());
    vi.stubGlobal("fetch", fetchMock);

    await generateJson({ ...input, model: "gemini-flash-lite-latest" });
    expect(sentConfig(fetchMock).thinkingConfig).toEqual({ thinkingLevel: "minimal" });

    fetchMock.mockClear();
    await generateJson({ ...input, model: "gemini-2.5-flash" });
    expect(sentConfig(fetchMock).thinkingConfig).toBeUndefined();
  });
});
