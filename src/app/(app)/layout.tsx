import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectHeaderSection } from "@/modules/projects";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={
        <Suspense fallback={<Skeleton className="h-10 w-2/3" />}>
          <ProjectHeaderSection />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
