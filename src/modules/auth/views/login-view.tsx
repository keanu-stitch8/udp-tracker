import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignIn } from "../components/google-sign-in";

/** Kartu masuk ala blok NeoBrutalism "sign-in card with social buttons", hanya dengan tombol Google. */
export function LoginView() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle className={PAGE_TITLE}>UDP Tracker</CardTitle>
          <CardDescription>Masuk dengan akun Google untuk mencatat UDP produksi. Akun baru menunggu persetujuan admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <GoogleSignIn />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
