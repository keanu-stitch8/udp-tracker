"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api-client";
import { safeNextPath } from "../lib/safe-next";

export function LoginForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => apiFetch<void>("/api/auth/login", { method: "POST", json: { password } }),
    onSuccess: () => {
      router.replace(next);
      router.refresh();
    },
  });
  const error = mutation.error instanceof ApiError ? (mutation.error.fieldErrors.password?.[0] ?? mutation.error.message) : null;

  return (
    <form
      // POST: bila tersubmit sebelum hydrate, password tidak pernah masuk ke URL.
      method="post"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button type="submit" size="lg" disabled={mutation.isPending || !password}>
        {mutation.isPending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
