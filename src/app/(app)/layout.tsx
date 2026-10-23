import { Suspense } from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppShell } from "@/components/app/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectHeaderSection } from "@/modules/projects";
import { AccountGateSection } from "@/modules/users";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={
        <Suspense fallback={<Skeleton className="h-10 w-2/3" />}>
          <AppHeader projectHeader={<ProjectHeaderSection />} />
        </Suspense>
      }
    >
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <AccountGateSection>{children}</AccountGateSection>
      </Suspense>
    </AppShell>
  );
}
