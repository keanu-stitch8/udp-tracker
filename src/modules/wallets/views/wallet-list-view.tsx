import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletListSection } from "../sections/wallet-list-section";

export function WalletListView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={PAGE_TITLE}>Dompet</h1>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <WalletListSection />
      </Suspense>
    </div>
  );
}
