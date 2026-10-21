import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletDetailSection } from "../sections/wallet-detail-section";

export function WalletDetailView({ walletId }: { walletId: Promise<string> }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/lainnya/dompet" className="flex items-center gap-1 self-start text-sm">
        <ChevronLeft className="size-4" /> Dompet
      </Link>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <WalletDetailSection walletId={walletId} />
      </Suspense>
    </div>
  );
}
