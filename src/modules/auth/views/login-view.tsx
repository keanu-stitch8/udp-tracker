import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "../components/login-form";

export function LoginView() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle className={PAGE_TITLE}>UDP Tracker</CardTitle>
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
