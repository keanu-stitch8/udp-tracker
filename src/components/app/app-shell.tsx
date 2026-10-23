import { Suspense, type ReactNode } from "react";
import { BottomNavLinks } from "./bottom-nav";

/** Kerangka mobile: header kuning, konten, bottom nav (`nav` = section yang menentukan tombol catat). Desktop: kolom tengah maks 480px. */
export function AppShell({ header, nav, children }: { header: ReactNode; nav: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
      <header className="sticky top-0 z-30 border-b-2 bg-primary px-4 py-3">{header}</header>
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <Suspense fallback={<BottomNavLinks pathname="" showAdd={false} />}>{nav}</Suspense>
    </div>
  );
}
