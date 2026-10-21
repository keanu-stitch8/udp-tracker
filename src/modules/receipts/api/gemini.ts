import "server-only";

export type GeminiFailure = "quota" | "timeout" | "failed";

export class GeminiError extends Error {
  constructor(readonly reason: GeminiFailure, message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

interface GenerateJsonInput {
  apiKey: string;
  model: string;
  prompt: string;
  file: { mimeType: string; base64: string };
  schema: object;
  timeoutMs?: number;
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** REST `generateContent` dengan output JSON terstruktur. Timeout 30 detik: satu panggilan teks saja ±10 detik (diukur 2026-10-21). */
export async function generateJson({ apiKey, model, prompt, file, schema, timeoutMs = 30_000 }: GenerateJsonInput): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: file.mimeType, data: file.base64 } }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingLevel: "low" } },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") throw new GeminiError("timeout", "Gemini timeout.");
    throw new GeminiError("failed", `Gemini tidak terjangkau: ${String(error)}`);
  }
  if (response.status === 429) throw new GeminiError("quota", "Kuota Gemini habis.");
  if (!response.ok) throw new GeminiError("failed", `Gemini HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const body = (await response.json()) as GenerateContentResponse;
  const text = body.candidates?.[0]?.content?.parts?.findLast((part) => typeof part.text === "string")?.text;
  if (!text) throw new GeminiError("failed", "Gemini tidak mengembalikan teks.");
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("failed", "JSON Gemini tidak valid.");
  }
}
