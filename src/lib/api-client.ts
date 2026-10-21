import type { ErrorBody, FieldErrors } from "./errors";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;
  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Panggil /api/* dari browser. Error → ApiError (pesan + error per field). 401 → ke halaman login. */
export async function apiFetch<T>(url: string, init: Omit<RequestInit, "body"> & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (response.status === 401 && typeof window !== "undefined") {
    // Sesi habis: reload penuh (bukan router.push) supaya cache TanStack Query ikut terbuang.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ErrorBody>;
    throw new ApiError(response.status, body.error ?? `Permintaan gagal (HTTP ${response.status}).`, body.fieldErrors);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
