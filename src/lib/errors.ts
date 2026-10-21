// Error domain → status HTTP. Pesan untuk pengguna dalam Bahasa Indonesia (spec §8).
export class AppError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

export type FieldErrors = Record<string, string[]>;

export class ValidationError extends AppError {
  readonly fieldErrors: FieldErrors;
  constructor(fieldErrors: FieldErrors, message = "Periksa kembali isian yang ditandai.") {
    super(message, 422);
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi berakhir, silakan login lagi.") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan.") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 503);
  }
}

/** Bentuk body error JSON yang dibaca `apiFetch` di browser. */
export interface ErrorBody {
  error: string;
  fieldErrors?: FieldErrors;
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message, fieldErrors: error.fieldErrors } satisfies ErrorBody, { status: error.status });
  }
  if (error instanceof AppError) {
    return Response.json({ error: error.message } satisfies ErrorBody, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Terjadi kesalahan di server. Coba lagi." } satisfies ErrorBody, { status: 500 });
}
