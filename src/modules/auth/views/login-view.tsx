import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../components/login-form";

export function LoginView() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-head text-2xl">UDP Tracker</CardTitle>
          <CardDescription>Masukkan password untuk mencatat UDP produksi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
