import { z } from "zod";
import { ValidationError, type FieldErrors } from "./errors";

/** Validasi input tak tepercaya; gagal → ValidationError berisi pesan per field (error tanpa path → "_form"). */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const flat = z.flattenError(result.error);
  const fieldErrors: FieldErrors = { ...(flat.fieldErrors as FieldErrors) };
  if (flat.formErrors.length) fieldErrors._form = flat.formErrors;
  throw new ValidationError(fieldErrors);
}
