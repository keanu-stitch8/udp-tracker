import { Suspense } from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppShell } from "@/components/app/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavSection } from "@/modules/menu";
import { NotificationBellSection } from "@/modules/notifications";
import { ProjectHeaderSection } from "@/modules/projects";
import { AccountGateSection, HeaderAvatarSection, ViewAsBannerSection } from "@/modules/users";
import { WalletScopeSection } from "@/modules/wallets";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={
        <Suspense fallback={<Skeleton className="h-10 w-2/3" />}>
          <AppHeader
            projectHeader={<ProjectHeaderSection />}
            bell={
              <Suspense fallback={null}>
                <NotificationBellSection />
              </Suspense>
            }
            avatar={<HeaderAvatarSection />}
          />
        </Suspense>
      }
      nav={<BottomNavSection />}
    >
      <Suspense fallback={null}>
        <ViewAsBannerSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <AccountGateSection>
          <WalletScopeSection>{children}</WalletScopeSection>
        </AccountGateSection>
      </Suspense>
    </AppShell>
  );
}
