import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletListSection } from "../sections/wallet-list-section";

export function WalletListView() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-head text-2xl">Dompet</h1>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <WalletListSection />
      </Suspense>
    </div>
  );
}
